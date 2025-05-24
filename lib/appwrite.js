import "react-native-url-polyfill/auto";

import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  platform: "com.niharwalawalkar.aora",
  projectId: "682c602a001a613b3443",
  storageId: "682c6706001d1947f707",
  databaseId: "682c638100153f9d3530",
  userCollectionId: "682c63c500156227b25b",
  videoCollectionId: "682c640a0014a5ea253d",
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

// Register user
export async function createUser(email, password, username) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
        bookmarks: [], // This will be stored as a JSON array
      }
    );

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    const userDoc = currentUser.documents[0];

    // Parse bookmarks if it exists, otherwise initialize it
    if (userDoc.bookmarks) {
      userDoc.bookmarks = Array.isArray(userDoc.bookmarks)
        ? userDoc.bookmarks
        : JSON.parse(userDoc.bookmarks);
    } else {
      userDoc.bookmarks = [];
    }

    return userDoc;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  };

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId, type) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

// Get all video Posts
export async function getAllPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt")]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts created by user
export async function getUserPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get latest created video posts
export async function getLatestPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get bookmarked video posts for the current user
export async function getBookmarkedPosts() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const bookmarkedPostIds = currentUser.bookmarks || [];
    if (bookmarkedPostIds.length === 0) return [];

    // Fetch each bookmarked post individually
    const posts = [];
    const invalidPostIds = []; // Track invalid post IDs to remove them

    for (const postId of bookmarkedPostIds) {
      try {
        const post = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.videoCollectionId,
          postId
        );
        posts.push(post);
      } catch (error) {
        if (
          error.message.includes(
            "Document with the requested ID could not be found"
          )
        ) {
          invalidPostIds.push(postId); // Mark for removal
        } else {
          console.warn(`Failed to fetch post with ID ${postId}:`, error);
        }
      }
    }

    // Remove invalid post IDs from the user's bookmarks
    if (invalidPostIds.length > 0) {
      const updatedBookmarks = bookmarkedPostIds.filter(
        (id) => !invalidPostIds.includes(id)
      );
      try {
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.userCollectionId,
          currentUser.$id,
          {
            bookmarks: updatedBookmarks,
          }
        );
      } catch (updateError) {
        console.warn("Failed to update user's bookmarks:", updateError);
      }
    }

    return posts;
  } catch (error) {
    throw new Error(error);
  }
}

// Bookmark or unbookmark a post
export async function bookmarkPost(postId) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const userId = currentUser.$id;
    let bookmarks = currentUser.bookmarks || [];

    let updatedBookmarks;
    if (bookmarks.includes(postId)) {
      // Remove bookmark
      updatedBookmarks = bookmarks.filter((id) => id !== postId);
    } else {
      // Add bookmark
      updatedBookmarks = [...bookmarks, postId];
    }

    // Update the user's bookmarks array in the database
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      {
        bookmarks: updatedBookmarks,
      }
    );

    // Return the updated user object with the new bookmarks array
    const updatedUser = await getCurrentUser();
    return updatedUser;
  } catch (error) {
    throw new Error(error);
  }
}

// Delete a post and its associated storage files
export async function deletePost(postId) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    // Fetch the post to check its creator and get storage file URLs
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      postId
    );

    // Check if the current user is the creator of the post
    if (post.creator.$id !== currentUser.$id) {
      throw new Error("You are not authorized to delete this post");
    }

    // Extract storage file IDs from the thumbnail and video URLs
    const extractStorageId = (url) => {
      const match = url.match(/files\/([^\/]+)/);
      return match ? match[1] : null;
    };

    const thumbnailId = extractStorageId(post.thumbnail);
    const videoId = extractStorageId(post.video);

    // Delete the storage files (thumbnail and video)
    if (thumbnailId) {
      await storage.deleteFile(appwriteConfig.storageId, thumbnailId);
    }
    if (videoId) {
      await storage.deleteFile(appwriteConfig.storageId, videoId);
    }

    // Delete the post document from the database
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      postId
    );

    // Remove the post from the user's bookmarks if it exists
    let bookmarks = currentUser.bookmarks || [];
    if (bookmarks.includes(postId)) {
      const updatedBookmarks = bookmarks.filter((id) => id !== postId);
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        currentUser.$id,
        {
          bookmarks: updatedBookmarks,
        }
      );
    }

    return true; // Indicate success
  } catch (error) {
    throw new Error(error);
  }
}

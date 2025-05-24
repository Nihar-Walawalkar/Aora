import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, RefreshControl, Text, View } from "react-native";

import useAppwrite from "../../lib/useAppwrite";
import SearchInput from "../../components/SearchInput";
import EmptyState from "../../components/EmptyState";
import VideoCard from "../../components/VideoCard";
import { getBookmarkedPosts } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";

const Bookmark = () => {
  const { user } = useGlobalContext();
  const { data: fetchedPosts, refetch } = useAppwrite(getBookmarkedPosts);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!fetchedPosts) return;
    const currentPostIds = posts.map((post) => post.$id).sort();
    const newPostIds = fetchedPosts.map((post) => post.$id).sort();
    if (JSON.stringify(currentPostIds) !== JSON.stringify(newPostIds)) {
      setPosts(fetchedPosts);
    }
  }, [fetchedPosts]);

  useEffect(() => {
    refetch();
  }, [user?.bookmarks, refetch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDeletePost = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.$id !== postId));
  };

  return (
    <SafeAreaView className="bg-primary flex-1">
      <View className="flex my-6 px-4 space-y-6">
        <View className="flex justify-between items-start flex-row mb-6">
          <Text className="text-2xl font-psemibold text-white">
            Saved Videos
          </Text>
        </View>
        <SearchInput ref={searchInputRef} />
      </View>

      <View className="flex-1">
        <FlatList
          data={posts}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <VideoCard
              id={item.$id}
              title={item.title}
              thumbnail={item.thumbnail}
              video={item.video}
              creator={item.creator.username}
              avatar={item.creator.avatar}
              creatorId={item.creator.$id}
              onDelete={handleDeletePost}
            />
          )}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          ListEmptyComponent={() => (
            <EmptyState
              title="No Saved Videos"
              subtitle="You haven't saved any videos yet"
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default Bookmark;

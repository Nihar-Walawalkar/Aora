import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, Image, RefreshControl, Text, View } from "react-native";

import { images } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import SearchInput from "../../components/SearchInput";
import Trending from "../../components/Trending";
import EmptyState from "../../components/EmptyState";
import { getAllPosts, getLatestPosts } from "../../lib/appwrite";
import VideoCard from "../../components/VideoCard";
import { useGlobalContext } from "../../context/GlobalProvider";

const Home = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { data: fetchedPosts, refetch } = useAppwrite(getAllPosts);
  const { data: fetchedLatestPosts } = useAppwrite(getLatestPosts);

  const [posts, setPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
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
    if (!fetchedLatestPosts) return;
    const currentLatestPostIds = latestPosts.map((post) => post.$id).sort();
    const newLatestPostIds = fetchedLatestPosts.map((post) => post.$id).sort();
    if (
      JSON.stringify(currentLatestPostIds) !== JSON.stringify(newLatestPostIds)
    ) {
      setLatestPosts(fetchedLatestPosts);
    }
  }, [fetchedLatestPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDeletePost = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.$id !== postId));
    setLatestPosts((prevLatestPosts) =>
      prevLatestPosts.filter((post) => post.$id !== postId)
    );
  };

  return (
    <SafeAreaView className="bg-primary flex-1">
      <View className="flex my-6 px-4 space-y-6">
        <View className="flex justify-between items-start flex-row mb-6">
          <View>
            <Text className="font-pmedium text-sm text-gray-100">
              Welcome Back,
            </Text>
            <Text className="text-2xl font-psemibold text-white">
              {user?.username}
            </Text>
          </View>
          <View className="mt-1.5">
            <Image
              source={images.logoSmall}
              className="w-9 h-10"
              resizeMode="contain"
            />
          </View>
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
          ListHeaderComponent={() => (
            <View className="w-full flex-1 pt-5 pb-8 px-4">
              <Text className="text-lg font-pregular text-gray-100 mb-3">
                Latest Videos
              </Text>
              <Trending posts={latestPosts} />
            </View>
          )}
          ListEmptyComponent={() => (
            <EmptyState
              title="No Videos Found"
              subtitle="No videos created yet"
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

export default Home;

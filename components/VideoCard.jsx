import { useRef, useState } from "react";
import { ResizeMode, Video } from "expo-av";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { Vimeo } from "react-native-vimeo-iframe";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { bookmarkPost, deletePost } from "../lib/appwrite";
import { useGlobalContext } from "../context/GlobalProvider";

import { icons } from "../constants";

// Utility function to extract Vimeo video ID from URL
const extractVimeoId = (url) => {
  const match = url.match(/vimeo\.com\/video\/(\d+)/);
  return match ? match[1] : null;
};

// Check if the URL is a Vimeo URL
const isVimeoUrl = (url) => {
  return url.includes("vimeo.com/video/");
};

const VideoCard = ({
  title,
  creator,
  avatar,
  thumbnail,
  video,
  id,
  creatorId,
  onDelete,
}) => {
  const { user, setUser } = useGlobalContext();
  const [play, setPlay] = useState(false);
  const videoRef = useRef(null);

  const vimeoId = extractVimeoId(video);
  const isVimeo = isVimeoUrl(video);

  const handleBookmark = async () => {
    try {
      if (!id) throw new Error("Post ID is missing");
      const updatedUser = await bookmarkPost(id);
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to bookmark post:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost(id);
              if (onDelete) {
                onDelete(id);
              }
            } catch (error) {
              console.error("Failed to delete post:", error);
              Alert.alert(
                "Error",
                "Failed to delete the post. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleVimeoStateChange = (event) => {
    if (event === "ended") {
      setPlay(false);
    } else if (event === "error") {
      console.error("Vimeo playback error");
      setPlay(false);
    }
  };

  const isBookmarked = user?.bookmarks?.includes(id) || false;
  const isCreator = user?.$id === creatorId;

  return (
    <View className="flex flex-col items-center px-4 mb-14">
      <View className="flex flex-row gap-3 items-start">
        <View className="flex justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary flex justify-center items-center p-0.5">
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>

          <View className="flex justify-center flex-1 ml-3 gap-y-1">
            <Text
              className="font-psemibold text-sm text-white"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              className="text-xs text-gray-100 font-pregular"
              numberOfLines={1}
            >
              {creator}
            </Text>
          </View>
        </View>

        <View className="flex flex-row items-center">
          <TouchableOpacity className="pt-2 mr-3" onPress={handleBookmark}>
            <Image
              source={icons.bookmark}
              className="w-5 h-5"
              resizeMode="contain"
              style={{ tintColor: isBookmarked ? "#FFA001" : "#CDCDE0" }}
            />
          </TouchableOpacity>

          {isCreator && (
            <TouchableOpacity className="pt-2" onPress={handleDelete}>
              <MaterialIcons name="delete" size={24} color="#FF0000" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {play ? (
        <View style={{ width: 343, height: 240 }}>
          {isVimeo && vimeoId ? (
            Vimeo ? (
              <Vimeo
                videoId={vimeoId}
                params="api=1&autoplay=1&transparent=0"
                controls={true}
                style={{
                  width: 343,
                  height: 240,
                  borderRadius: 12,
                  marginTop: 12,
                }}
                webViewProps={{
                  bounces: false,
                  scrollEnabled: false,
                  style: { backgroundColor: "black" },
                }}
                onReady={() => {}}
                onError={(error) => {
                  console.error("Vimeo error:", error);
                  setPlay(false);
                }}
                onStateChange={handleVimeoStateChange}
              />
            ) : (
              <Text className="text-white">
                Error: Vimeo component not available. Please check installation.
              </Text>
            )
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: video }}
              className="w-[343px] h-60 rounded-xl mt-3"
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) {
                  setPlay(false);
                }
                if (status.error) {
                  setPlay(false);
                }
              }}
              onError={(error) => {
                setPlay(false);
              }}
            />
          )}
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setPlay(true);
          }}
          className="w-full h-60 rounded-xl mt-3 relative flex justify-center items-center"
        >
          <Image
            source={{ uri: thumbnail }}
            className="w-full h-full rounded-xl mt-3"
            resizeMode="cover"
          />
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default VideoCard;

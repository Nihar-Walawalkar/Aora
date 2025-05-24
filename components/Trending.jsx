import { useState, useRef } from "react";
import { Video, ResizeMode } from "expo-av";
import * as Animatable from "react-native-animatable";
import {
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import { Vimeo } from "react-native-vimeo-iframe";

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

const TrendingItem = ({ activeItem, item }) => {
  const [play, setPlay] = useState(false);
  const videoRef = useRef(null);

  const vimeoId = extractVimeoId(item.video);
  const isVimeo = isVimeoUrl(item.video);

  const handleVimeoStateChange = (event) => {
    if (event === "ended") {
      setPlay(false);
    } else if (event === "error") {
      console.error("Vimeo playback error");
      setPlay(false);
    }
  };

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem === item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      {play ? (
        <View style={{ position: "relative" }}>
          {isVimeo && vimeoId ? (
            Vimeo ? (
              <Vimeo
                videoId={vimeoId}
                params="api=1&autoplay=1&transparent=0"
                controls={true}
                style={{
                  width: 208,
                  height: 288,
                  borderRadius: 33,
                  marginTop: 12,
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
              source={{ uri: item.video }}
              className="w-52 h-72 rounded-[33px] mt-3 bg-white/10"
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
          className="relative flex justify-center items-center"
          activeOpacity={0.7}
          onPress={() => {
            setPlay(true);
          }}
        >
          <ImageBackground
            source={{ uri: item.thumbnail }}
            className="w-52 h-72 rounded-[33px] my-5 overflow-hidden shadow-lg shadow-black/40"
            resizeMode="cover"
          />
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};

const Trending = ({ posts }) => {
  const [activeItem, setActiveItem] = useState(posts[0]?.$id || null);

  const viewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].item.$id);
    }
  };

  return (
    <FlatList
      data={posts}
      horizontal
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <TrendingItem activeItem={activeItem} item={item} />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170 }}
    />
  );
};

export default Trending;

const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
};

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
};

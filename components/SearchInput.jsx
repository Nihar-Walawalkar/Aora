import React, { forwardRef, useImperativeHandle, useRef, useCallback } from "react";
import { router, usePathname } from "expo-router";
import {
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";

import { icons } from "../constants";

// Use forwardRef to allow parent components to control focus
const SearchInput = forwardRef(({ onFocus, onBlur }, ref) => {
  const pathname = usePathname();
  const [query, setQuery] = React.useState("");
  const textInputRef = useRef(null);

  // Expose a focus method to the parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      textInputRef.current?.focus();
    },
  }));

  // Memoize the onFocus and onBlur handlers to prevent re-renders
  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  const handleContainerPress = useCallback(() => {
    textInputRef.current?.focus();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleContainerPress}>
      <View className="flex flex-row items-center space-x-4 w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 focus:border-secondary">
        <TextInput
          ref={textInputRef}
          className="text-base mt-0.5 text-white flex-1 font-pregular"
          value={query}
          placeholder="Search a video topic"
          placeholderTextColor="#CDCDE0"
          onChangeText={(e) => setQuery(e)}
          editable={true}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        <TouchableOpacity
          onPress={() => {
            if (query === "")
              return Alert.alert(
                "Missing Query",
                "Please input something to search results across database"
              );

            if (pathname.startsWith("/search")) router.setParams({ query });
            else router.push(`/search/${query}`);
          }}
        >
          <Image
            source={icons.search}
            className="w-5 h-5"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
});

// Memoize the component to prevent unnecessary re-renders
export default React.memo(SearchInput);

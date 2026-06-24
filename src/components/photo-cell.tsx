import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { thumbUri, type Photo } from "@/lib/photos";

type Props = {
  photo: Photo;
  selecting: boolean;
  selected: boolean;
  onToggle: (id: number) => void;
  // Android only: long-press enters select mode (iOS uses the toolbar button and
  // reserves long-press for the peek/context menu).
  onLongPress?: (id: number) => void;
};

export function PhotoCell({
  photo,
  selecting,
  selected,
  onToggle,
  onLongPress,
}: Props) {
  // Fire a haptic, then run the long-press action. Only Android wires this up
  // (it enters select mode); on iOS the long-press peek/context menu provides
  // its own system haptic, so this stays undefined there.
  const handleLongPress = onLongPress
    ? () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(photo.id);
      }
    : undefined;

  // Preview size is derived from the loaded image's real dimensions, so it
  // shows just the image (no letterboxing) without any hardcoded aspect. iOS
  // scales the preview down to fit the screen, so we don't cap the height.
  const { width: screenWidth } = useWindowDimensions();
  const [aspect, setAspect] = useState<number | null>(null);
  const theme = useTheme();

  const preview = {
    width: screenWidth,
    height: aspect ? screenWidth / aspect : screenWidth,
  };

  return (
    // Always a Link so the cell never remounts when toggling select mode
    // (avoids re-fading every thumbnail). In select mode we cancel the
    // navigation and toggle selection instead. Long-press opens a peek
    // preview + context menu (iOS only).
    <Link
      href={`/photos/${photo.id}`}
      asChild
      onPress={(e) => {
        if (selecting) {
          e.preventDefault();
          onToggle(photo.id);
        }
      }}
    >
      <Link.Trigger withAppleZoom>
        <Pressable
          style={styles.cell}
          onLongPress={handleLongPress}
        >
          <Image
            style={[styles.image, { backgroundColor: theme.backgroundElement }]}
            source={thumbUri(photo.id)}
            contentFit="cover"
            transition={150}
          />
          {selected &&
            // iOS draws the two-tone SF Symbol directly. On Android SymbolView
            // renders a single-color glyph, so wrap a white check in a blue
            // circle to get the same white-on-blue badge.
            (process.env.EXPO_OS === "android" ? (
              <View style={[styles.checkmark, styles.androidBadge]}>
                <SymbolView
                  name={{ android: "check" }}
                  size={18}
                  tintColor="#FFFFFF"
                />
              </View>
            ) : (
              <SymbolView
                name="checkmark.circle.fill"
                size={26}
                type="palette"
                colors={["#FFFFFF", "#007AFF"]}
                style={styles.checkmark}
              />
            ))}
        </Pressable>
      </Link.Trigger>
      <Link.Preview style={preview}>
        <Image
          style={preview}
          source={photo.uri}
          contentFit="cover"
          onLoad={(e) => setAspect(e.source.width / e.source.height)}
        />
      </Link.Preview>
      <Link.Menu>
        <Link.Menu inline palette>
          <Link.MenuAction icon="square.and.arrow.up" onPress={() => {}}>
            Share
          </Link.MenuAction>
          <Link.MenuAction icon="heart" onPress={() => {}}>
            Favorite
          </Link.MenuAction>
          <Link.MenuAction icon="trash" destructive onPress={() => {}}>
            Delete
          </Link.MenuAction>
        </Link.Menu>
        <Link.MenuAction icon="doc.on.doc" onPress={() => {}}>
          Copy
        </Link.MenuAction>
        <Link.MenuAction icon="plus.square.on.square" onPress={() => {}}>
          Duplicate
        </Link.MenuAction>
        <Link.MenuAction icon="eye.slash" onPress={() => {}}>
          Hide
        </Link.MenuAction>
        <Link.MenuAction icon="rectangle.stack.badge.plus" onPress={() => {}}>
          Add to Album
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  image: {
    flex: 1,
  },
  checkmark: {
    position: "absolute",
    bottom: 6,
    right: 6,
  },
  androidBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
});

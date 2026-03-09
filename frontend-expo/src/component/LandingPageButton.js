import {
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";

export default function LandingPageButton({ bgColor, btnLabel, textColor, press }) {
  return (
    <TouchableOpacity
    onPress={press}
      style={{
        backgroundColor: bgColor,
        borderRadius: 100,
        alignItems: "center",
        width: 300,
        paddingVertical:10,
        marginVertical:10
      }}
    >
      <Text style={{ color: textColor, fontSize: 25, fontWeight: "bold" }}>
        {btnLabel}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({});

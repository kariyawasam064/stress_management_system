import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";

export default function Header() {
  const navigation = useNavigation();
  return (
    <View
      style={{
        backgroundColor: "#FF8C00",
        opacity: 0.9,
        height: 60,
        padding: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        {/* <Image
        source={require("../../LoginAndSignup/assets/hjs_logo.png")}
        style={{ width: 35, height: 35, marginLeft: 25 }}
      /> */}
        <Text
          style={{
            color: "white",
            fontSize: 25,
            fontWeight: "bold",
          }}
        >
          Fix-Mind
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({});

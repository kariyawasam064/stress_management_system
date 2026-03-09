import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Footer() {
  const navigation = useNavigation();
  return (
    <View
      style={{
        backgroundColor: "#FF8C00",
        opacity: 0.9,
        height: 80,
        width: "100%",
        position: "absolute",
        bottom: 0,
        alignItems: "center",
        justifyContent: "space-around",
        flexDirection: "row",
        paddingLeft: 25,
        paddingRight: 25,
      }}
    >
      <TouchableOpacity onPress={() => navigation.navigate("SocialDashboard")}>
        <FontAwesome
          name="users"
          size={25}
          color={"white"}
          style={{ paddingRight: 5 }}
        />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate("AcademicDashboard")}>
      <FontAwesome
        name="book"
        size={25}
        color={"white"}
        style={{ marginLeft: "auto", paddingRight: 5 }}
      />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate("FinancialDashboard")}>
      <FontAwesome
        name="money"
        size={25}
        color={"white"}
        style={{ marginLeft: "auto", paddingRight: 5 }}
      />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("CostDashboard")}>
      <FontAwesome
        name="pencil"
        size={25}
        color={"white"}
        style={{ marginLeft: "auto", paddingRight: 5 }}
      />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({});

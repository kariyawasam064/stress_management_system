import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import Background from "./Background";
import LandingPageButton from "./LandingPageButton";
import { darkGreen } from "./LandingPageConstants";

const LandingPage = (props) => {
  return (
    <Background>
      <View style={{ marginHorizontal: 40, marginVertical: 100}}>
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', marginTop:140 }}>
        <Image
          source={require("./assets/hjs_logo.png")}
          style={{ width: 120, height: 90, backgroundColor:darkGreen, borderRadius:45}}
        />
        </View>
        <Text
          style={{
            color: "white",
            fontSize: 54,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Ino Agri
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 50,
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Mobile App
        </Text>
        <Text style={{ color: "white", fontSize: 15, marginBottom: 60, textAlign:'center' }}>
          Inovative Discovery in the Gherkins Cultivation
        </Text>
        <LandingPageButton
          bgColor={darkGreen}
          textColor="white"
          btnLabel={"Login"}
          press={() => props.navigation.navigate("Login")}
        />
        <LandingPageButton
          bgColor="white"
          textColor={darkGreen}
          btnLabel={"SignUp"}
          press={() => props.navigation.navigate("Signup")}
        />
        <Text
          style={{
            color: "white",
            fontSize: 10,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {" "}
          ©️ {new Date().getFullYear()} Hjs All rights reserved.
        </Text>
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({});

export default LandingPage;

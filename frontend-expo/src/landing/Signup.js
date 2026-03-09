import { Image, Text, TouchableOpacity, View, TextInput } from "react-native";
import React, { useState } from "react";
import Background from "../component/Background";
import { darkGreen } from "../component/LandingPageConstants";
import LandingPageButton from "../component/LandingPageButton";
import Node from "../api/node/Node";
import axios from "axios";

const Signup = (props) => {
    const [uName, setFullName] = useState("");
    const [uEmail, setEmail] = useState("");
    const [uLocation, setLocation] = useState("");
    const [uContactNo, setContactNo] = useState("");
    const [uPassword, setPassword] = useState("");
    const [conpassword, setConPassword] = useState("");

    const usrSignUp = () => {
        if (
          uName != "" &&
          uEmail != "" &&
          uLocation != "" &&
          uContactNo != "" &&
          uPassword != "" &&
          conpassword != ""
        ) {
          if (conpassword === uPassword) {
            const ob = {
              full_name:uName,
              email:uEmail,
              address:uLocation,
              contact_no:uContactNo,
              password:uPassword,
            };
            console.log('check',ob)
            Node.post("/user/Signup", ob)
              .then(() => {
                alert("User Registred!");
                props.navigation.navigate("Login");
              })
              .catch((err) => {
                alert("Error",err);
                console.log(err)
              });
          } else {
            alert("Error");
          }
        } else {
          alert("Error");
        }
    };

    return (
        <Background>
            <View style={{ alignItems: "center", backgroundColor: '#FF8C00' }}>
                <Text
                    style={{
                        color: "white",
                        fontSize: 54,
                        fontWeight: "bold",
                        marginTop: 10,
                    }}
                >
                    Fix-Mind
                </Text>
                <Text
                    style={{
                        color: "white",
                        fontSize: 18,
                        fontStyle: "italic",
                        opacity: 0.9,
                    }}
                >
                    Create a new account
                </Text>

                <View
                    style={{
                        backgroundColor: "white",
                        height: 700,
                        width: "100%",
                        borderTopRightRadius: 100,
                        paddingTop: 40,
                        alignItems: "center",
                        marginTop: 20,
                    }}
                >
                    <TextInput
                        style={{
                            borderRadius: 100,
                            color: '#B0B0B0',
                            paddingHorizontal: 10,
                            width: "80%",
                            backgroundColor: "rgb(220,220,220)",
                            marginVertical: 10,
                            padding: 15,
                        }}
                        placeholderTextColor={'#B0B0B0'}
                        placeholder="Full Name"
                        onChangeText={(e) => setFullName(e)}
                    ></TextInput>

                    <TextInput
                        style={{
                            borderRadius: 100,
                            color: '#B0B0B0',
                            paddingHorizontal: 10,
                            width: "80%",
                            backgroundColor: "rgb(220,220,220)",
                            marginVertical: 10,
                            padding: 15,
                        }}
                        onChangeText={(e) => setEmail(e)}
                        placeholderTextColor={'#B0B0B0'}
                        placeholder="Email"
                        keyboardType="email-address"
                    ></TextInput>

                    <TextInput
                        style={{
                            borderRadius: 100,
                            color: '#B0B0B0',
                            paddingHorizontal: 10,
                            width: "80%",
                            backgroundColor: "rgb(220,220,220)",
                            marginVertical: 10,
                            padding: 15,
                        }}
                        onChangeText={(e) => setLocation(e)}
                        placeholderTextColor={'#B0B0B0'}
                        placeholder="Address"
                    ></TextInput>

                    <TextInput
                        style={{
                            borderRadius: 100,
                            color: '#B0B0B0',
                            paddingHorizontal: 10,
                            width: "80%",
                            backgroundColor: "rgb(220,220,220)",
                            marginVertical: 10,
                            padding: 15,
                        }}
                        onChangeText={(e) => setContactNo(e)}
                        placeholderTextColor={'#B0B0B0'}
                        placeholder="Contact No"
                    ></TextInput>

                    <TextInput
                        style={{
                            borderRadius: 100,
                            color: '#B0B0B0',
                            paddingHorizontal: 10,
                            width: "80%",
                            backgroundColor: "rgb(220,220,220)",
                            marginVertical: 10,
                            padding: 15,
                        }}
                        onChangeText={(e) => setPassword(e)}
                        placeholderTextColor={'#B0B0B0'}
                        placeholder="Password"
                        secureTextEntry={true}
                    ></TextInput>

                    <TextInput
                        style={{
                            borderRadius: 100,
                            color: '#B0B0B0',
                            paddingHorizontal: 10,
                            width: "80%",
                            backgroundColor: "rgb(220,220,220)",
                            marginVertical: 10,
                            padding: 15,
                        }}
                        onChangeText={(e) => setConPassword(e)}
                        placeholderTextColor={'#B0B0B0'}
                        placeholder="Confirm Password"
                        secureTextEntry={true}
                    ></TextInput>

                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            paddingRight: 20,
                            paddingLeft: 20,
                        }}
                    >
                        <Text style={{ color: "grey", fontWeight: "bold" }}>
                            By signing in, you agree to our{" "}
                        </Text>
                        <Text style={{ color: '#FF8C00', fontWeight: "bold" }}>
                            Terms & Conditions
                        </Text>
                    </View>
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            paddingRight: 20,
                            paddingLeft: 20,
                            justifyContent: "center",
                        }}
                    >
                        <Text style={{ color: "grey", fontWeight: "bold" }}>And </Text>
                        <Text style={{ color: '#FF8C00', fontWeight: "bold" }}>
                            Privacy Policy
                        </Text>
                    </View>
                    <LandingPageButton
                        textColor="white"
                        bgColor={'#FF8C00'}
                        btnLabel={"Sign Up"}
                        press={usrSignUp}
                    />

                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                        }}
                    >
                        <Text> Already have an account ? </Text>
                        <TouchableOpacity
                            onPress={() => props.navigation.navigate("Login")}
                        >
                            <Text style={{ color: '#FF8C00', fontWeight: "bold" }}>
                                Login
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Background>
    );
};

export default Signup;

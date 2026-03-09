import { Image, Text, TouchableOpacity, View, TextInput } from "react-native";
import React, { useContext, useState } from "react";
import Background from "../component/Background";
import { darkGreen } from "../component/LandingPageConstants";
import Field from "../component/Field";
import LandingPageButton from "../component/LandingPageButton";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import Node from "../api/node/Node";

const Login = (props) => {
    const { UserLogin, saveUserDeatils } = useContext(AuthContext);
    const [uEmail, setEmail] = useState("");
    const [uPassword, setPassword] = useState("");

    const uuLogin = () => {
        if (uEmail === "") {
            alert("Please enter your email");
        } else if (uPassword === "") {
            alert("Please enter password"); 
        } else {
            const ob = {
                email:uEmail,
                password:uPassword
            };
            
            Node.post("/user/Signin", ob)
                .then(response => {
                    UserLogin();
                    console.log(response.data)
                    saveUserDeatils(response.data)
                    //props.navigation.navigate("Home"); // Navigate after setting the token
                })
                .catch(() => {
                    alert("Incorrect Login!");
                });
        }
    };

    return (
        <Background>
            <View style={{ alignItems: "center", width: 400, backgroundColor: '#FF8C00' }}>
                <Text
                    style={{
                        color: "white",
                        fontSize: 54,
                        fontWeight: "bold",
                        marginTop: 50
                    }}
                >
                    Fix-Mind
                </Text>
                <Text
                    style={{
                        color: "white",
                        fontSize: 18,
                        fontStyle: "italic",
                        marginBottom: 40,
                        opacity: 0.9,
                    }}
                >
                    Balance Your Stress, Boost Your Focus
                </Text>

                <View
                    style={{
                        backgroundColor: "white",
                        height: 700,
                        width: "100%",
                        borderTopLeftRadius: 130,
                        paddingTop: 40,
                        alignItems: "center",
                        marginTop: 40,
                    }}
                >
                    {/* <Image
            source={require("./assets/hjs_logo.png")}
            style={{
              width: 70,
              height: 50,
              backgroundColor: darkGreen,
              borderRadius: 45,
            }}
          /> */}
                    <Text style={{ fontSize: 40, color: '#FF8C00', fontWeight: "bold" }}>
                        Welcome !
                    </Text>
                    <Text
                        style={{
                            fontSize: 19,
                            color: "#B0B0B0",
                            fontWeight: "bold",
                            marginBottom: 40,
                        }}
                    >
                        Loging to your account
                    </Text>
                    {/* <Field placeholder="Email or Username" keyboardType="email-address"  />
          <Field placeholder="Password" secureTextEntry={true} /> */}

                    <TextInput
                        style={{
                            borderRadius: 100,
                            color: "#B0B0B0",
                            paddingHorizontal: 10,
                            width: "80%",
                            backgroundColor: "rgb(220,220,220)",
                            marginVertical: 10,
                            padding: 15,
                        }}
                        placeholderTextColor={"#B0B0B0"}
                        placeholder="Email"
                        keyboardType="email-address"
                        onChangeText={(e) => setEmail(e)}
                    ></TextInput>

                    <TextInput
                        style={{
                            borderRadius: 100,
                            color: "#B0B0B0",
                            paddingHorizontal: 10,
                            width: "80%",
                            backgroundColor: "rgb(220,220,220)",
                            marginVertical: 10,
                            padding: 15,
                        }}
                        placeholderTextColor={"#B0B0B0"}
                        placeholder="Password"
                        secureTextEntry={true}
                        onChangeText={(e) => setPassword(e)}
                    ></TextInput>
                    <View
                        style={{
                            alignItems: "flex-end",
                            width: "78%",
                            paddingRight: 16,
                            marginBottom: 60,
                        }}
                    >
                        <Text
                            style={{ color: "#FF8C00", fontWeight: "bold", fontSize: 16 }}
                        >
                            Forgot Password?{" "}
                        </Text>
                    </View>

                    <LandingPageButton
                        textColor="white"
                        bgColor={"#FF8C00"}
                        btnLabel={"Login"}
                        press={() => {
                            // UserLogin();
                            uuLogin();
                        }}
                    />

                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                        }}
                    >
                        <Text> Don't have an account ? </Text>
                        <TouchableOpacity
                            onPress={() => props.navigation.navigate("Signup")}
                        >
                            <Text style={{ color: "#FF8C00", fontWeight: "bold" }}>
                                Signup
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Background>
    );
};

export default Login;

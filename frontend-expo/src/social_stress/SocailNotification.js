import React, { useState, useContext, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Modal,
    Dimensions,
    Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { AuthContext } from "../context/AuthContext";
import Node from "../api/node/Node";


const SocailNotification = () => {
    const { userDetails } = useContext(AuthContext);
    const navigation = useNavigation();

    useEffect(() => {
       
    }, []);


    return (
        <LinearGradient colors={["#ffffffff", "#f3ddc3ff"]} style={styles.container}>
            <Header />

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.heading}>Friends Notifications</Text>

                
            </ScrollView>
            <Footer />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 30,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    heading: {
        textAlign: "center",
        fontSize: 28,
        fontWeight: "bold",
        color: "#FF8C00",
        marginBottom: 10,
        textShadowColor: "rgba(0, 0, 0, 0.2)",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        paddingTop: 40
    }
});

export default SocailNotification;

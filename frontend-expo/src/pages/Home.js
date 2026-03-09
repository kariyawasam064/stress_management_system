import {
    StyleSheet,
    Text,
    View,
    Image,
    ScrollView,
} from "react-native";
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Header from "./Header";
import Footer from "./Footer";
import { LinearGradient } from "expo-linear-gradient";

const Home = (props) => {
    const { UserLogOut,userDetails } = useContext(AuthContext);
    console.log(userDetails)

    return (
        <LinearGradient colors={["#ffffffff", "#f3ddc3ff"]} style={styles.container}>
            <Header />
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.heading}>Welcome to Fix-Mind</Text>

                <Text style={styles.description}>
                    Mind-Fix helps students overcome everyday stress by using intelligent tools to create balance in life.
                    With AI-driven insights, you can manage academic, social, and personal pressures effectively —
                    leading to a healthier mind and better focus.
                </Text>

                {/* <Image
          source={require("../assets/gg.jpg")}
          style={styles.image}
        /> */}

                <Text style={styles.sectionTitle}>Key Features:</Text>
                <View style={styles.featureCard}>
                    <Text style={styles.featureIcon}>🤝</Text>
                    <Text style={styles.featureText}>
                        <Text style={styles.boldText}>Social Stress: </Text>
                        Manage relationships and social pressures effectively to build stronger connections.
                    </Text>
                </View>

                <View style={styles.featureCard}>
                    <Text style={styles.featureIcon}>📚</Text>
                    <Text style={styles.featureText}>
                        <Text style={styles.boldText}>Academic Stress: </Text>
                        Balance your study schedule and deadlines with smart time management tools.
                    </Text>
                </View>

                <View style={styles.featureCard}>
                    <Text style={styles.featureIcon}>💸</Text>
                    <Text style={styles.featureText}>
                        <Text style={styles.boldText}>Financial Stress: </Text>
                        Track expenses and plan your budget wisely to reduce financial anxiety.
                    </Text>
                </View>

                <View style={styles.featureCard}>
                    <Text style={styles.featureIcon}>🧠</Text>
                    <Text style={styles.featureText}>
                        <Text style={styles.boldText}>Test Stress: </Text>
                        Boost focus and confidence with relaxation tips before exams or important events.
                    </Text>
                </View>


                <Text style={styles.finalNote}>
                    Start your journey towards a calmer, more focused mind today.
                    With Mind-Fix, you can manage stress, boost productivity, and build a healthier, balanced life!
                </Text>
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
    },
    description: {
        textAlign: "center",
        fontSize: 16,
        color: "#000000ff",
        marginVertical: 15,
        lineHeight: 22,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        padding: 10,
        borderRadius: 8,
    },
    image: {
        width: "100%",
        height: 200,
        resizeMode: "cover",
        borderRadius: 10,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: "#004d40",
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FF8C00",
        marginVertical: 15,
    },
    featureCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fcc47eff",
        padding: 12,
        borderRadius: 10,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    featureIcon: {
        fontSize: 28,
        marginRight: 10,
        color: "#00796b",
    },
    featureText: {
        fontSize: 16,
        color: "white",
        flex: 1,
        lineHeight: 22,
    },
    boldText: {
        fontWeight: "bold",
        color: "white",
    },
    finalNote: {
        textAlign: "center",
        fontSize: 16,
        color: "#FF8C00",
        marginTop: 20,
        lineHeight: 24,
        fontStyle: "italic",
        padding: 15,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FF8C00",
    },
});

export default Home;

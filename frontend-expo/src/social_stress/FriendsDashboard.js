import React, { useState, useContext, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { AuthContext } from "../context/AuthContext";
import Node from "../api/node/Node";

const FriendDashboard = () => {
    const { userDetails } = useContext(AuthContext);
    const navigation = useNavigation();

    const [activeTab, setActiveTab] = useState("find");
    const [allUsers, setAllUsers] = useState([]);
    const [mySentRequests, setMySentRequests] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [myFriends, setMyFriends] = useState([]);

    useEffect(() => {
        const myEmail = userDetails.RegisterdUser.email;

        Node.get("/user/all")
            .then((res) => {
                const users = res.data;

                Node.get("/friend/get")
                    .then((res2) => {
                        const allRequests = res2.data;

                        const mySent = allRequests.filter(
                            (x) => x.sender === myEmail && x.status === "Requested"
                        );

                        const myReceived = allRequests.filter(
                            (x) => x.receiver === myEmail && x.status === "Requested"
                        );

                        const connectedFriends = allRequests.filter(
                            (x) =>
                                (x.sender === myEmail || x.receiver === myEmail) &&
                                x.status === "Connected"
                        );

                        setMySentRequests(mySent);
                        setReceivedRequests(myReceived);
                        setMyFriends(connectedFriends);

                        const sentEmails = mySent.map((x) => x.receiver);
                        const receivedEmails = myReceived.map((x) => x.sender);

                        // 🔥 FIX: REMOVE FRIEND LIST USERS FROM FIND TAB
                        const friendsEmails = connectedFriends.map((x) =>
                            x.sender === myEmail ? x.receiver : x.sender
                        );

                        const filteredUsers = users.filter(
                            (u) =>
                                u.email !== myEmail &&
                                !sentEmails.includes(u.email) &&
                                !receivedEmails.includes(u.email) &&
                                !friendsEmails.includes(u.email)
                        );

                        setAllUsers(filteredUsers);
                    })
                    .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
    }, []);

    const requestFriend = (email, fullName) => {
        const payload = {
            sender: userDetails.RegisterdUser.email,
            receiver: email,
            status: "Requested",
            sender_fullname: userDetails.RegisterdUser.full_name,
            receiver_fullname: fullName,
        };
        Node.post("/friend/add", payload)
            .then((res) => console.log("Friend Request Sent:", res.data))
            .catch((err) => console.log(err));
    };

    const acceptFriend = (id) => {
        Node.put(`/friend/update/${id}`)
            .then((res) => console.log("Friend Accepted:", res.data))
            .catch((err) => console.log(err));
    };

    const removeFriendRequest = (id) => {
        Node.delete(`/friend/remove/${id}`)
            .then(() => console.log("Friend Request Removed"))
            .catch((err) => console.log(err));
    };


    const renderList = () => {
        let listData = [];

        if (activeTab === "find") listData = allUsers;
        if (activeTab === "myRequests") listData = mySentRequests;
        if (activeTab === "newRequests") listData = receivedRequests;
        if (activeTab === "friends") listData = myFriends;

        const myEmail = userDetails.RegisterdUser.email;

        return listData.map((item) => (
            <View key={item._id} style={styles.friendCard}>
                <FontAwesome
                    name="user-circle"
                    size={40}
                    color="#FF8C00"
                    style={{ marginRight: 10 }}
                />

                <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>
                        {activeTab === "find"
                            ? item.full_name
                            : activeTab === "myRequests"
                                ? item.receiver_fullname
                                : activeTab === "newRequests"
                                    ? item.sender_fullname
                                    : item.sender === myEmail
                                        ? item.receiver_fullname
                                        : item.sender_fullname}
                    </Text>

                    <Text style={styles.friendEmail}>
                        {activeTab === "friends"
                            ? item.sender === myEmail
                                ? item.receiver
                                : item.sender
                            : activeTab === "find"
                                ? item.email
                                : activeTab === "myRequests"
                                    ? item.receiver
                                    : item.sender}
                    </Text>
                </View>

                {activeTab === "find" && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => requestFriend(item.email, item.full_name)}
                    >
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                )}

                {activeTab === "myRequests" && (
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeFriendRequest(item._id)}
                    >
                        <Text style={styles.addButtonText}>Remove</Text>
                    </TouchableOpacity>
                )}

                {activeTab === "newRequests" && (
                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => acceptFriend(item._id)}
                    >
                        <Text style={styles.addButtonText}>Accept</Text>
                    </TouchableOpacity>
                )}
            </View>
        ));
    };

    return (
        <LinearGradient colors={["#fff", "#f3ddc3"]} style={styles.container}>
            <Header />

            <View style={styles.tabRow}>
                <TouchableOpacity
                    onPress={() => setActiveTab("find")}
                    style={[styles.tabButton, activeTab === "find" && styles.activeTab]}
                >
                    <Text style={styles.tabText}>Find</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab("myRequests")}
                    style={[styles.tabButton, activeTab === "myRequests" && styles.activeTab]}
                >
                    <Text style={styles.tabText}>Sent</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab("newRequests")}
                    style={[styles.tabButton, activeTab === "newRequests" && styles.activeTab]}
                >
                    <Text style={styles.tabText}>Received</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab("friends")}
                    style={[styles.tabButton, activeTab === "friends" && styles.activeTab]}
                >
                    <Text style={styles.tabText}>Friends</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.contentContainer}>
                {renderList()}
            </ScrollView>

            <Footer />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 30 },
    contentContainer: { paddingHorizontal: 20, paddingBottom: 100 },

    tabRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 10,
        backgroundColor: "#ffe8cc",
    },

    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
    },

    activeTab: {
        backgroundColor: "#FF8C00",
    },

    tabText: {
        color: "#333",
        fontWeight: "bold",
    },

    friendCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 12,
        marginVertical: 6,
        borderRadius: 10,
        elevation: 3,
    },

    friendName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },

    friendEmail: {
        fontSize: 14,
        color: "#777",
    },

    addButton: {
        backgroundColor: "#FF8C00",
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 8,
    },

    acceptButton: {
        backgroundColor: "green",
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 8,
    },

    removeButton: {
        backgroundColor: "red",
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 8,
    },

    addButtonText: {
        color: "white",
        fontWeight: "bold",
    },
});

export default FriendDashboard;

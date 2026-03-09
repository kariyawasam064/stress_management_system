import React, { useState, useContext } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    PermissionsAndroid,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { AuthContext } from "../context/AuthContext";
import CallLogs from "react-native-call-log";
import SmsAndroid from "react-native-get-sms-android";
import * as ImagePicker from "expo-image-picker";
import Flask from "../api/fast/FlaskSocial";
import Node from "../api/node/Node"
import FlaskSocial from "../api/fast/FlaskSocial";
import * as Speech from "expo-speech";

const PredictStress = () => {
    const { userDetails } = useContext(AuthContext);
    const navigation = useNavigation();
    const [aiPredict, setAiPredict] = useState()

    const [selectedImage, setSelectedImage] = useState(null);
    const [faceMood, setfaceMood] = useState('');
    const [formData, setFormData] = useState({
        face_mood: "",
        messages_sent: "",
        messages_received: "",
        calls_incoming: "",
        calls_outgoing: "",
        sleep_hours: "",
    });
    const [predictResult, setPredictResult] = useState('')
    const [predictResult2, setPredictResult2] = useState({})

    // ---------------------- CAMERA ----------------------
    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            alert("Camera permission required!");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.6,
        });

        if (!result.canceled) {
            const formData = new FormData();
            formData.append("file", {
                uri: result.assets[0].uri,
                type: "image/jpeg",
                name: "photo.jpg",
            });

            console.log(formData)
            Flask.post('/face_predict', formData).then((res) => {
                console.log(res.data);
                setFormData(prev => ({
                    ...prev,
                    face_mood: res.data.emotion
                }));

                setfaceMood(res.data.emotion);
                // console.log(res.data.confidence)
            }).catch((err) => {
                console.log(err)
            })
            setSelectedImage(result.assets[0].uri);
        }
    };

    // ---------------------- STATS ----------------------
    const getTodayCallLogs = async () => {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;

        const today = new Date().setHours(0, 0, 0, 0);

        CallLogs.load(100).then((calls) => {
            const todayCalls = calls.filter((c) => c.timestamp >= today);

            setFormData((prev) => ({
                ...prev,
                calls_incoming: todayCalls.filter((c) => c.type === "INCOMING").length.toString(),
                calls_outgoing: todayCalls.filter((c) => c.type === "OUTGOING").length.toString(),
            }));
        });
    };

    const getTodaySMS = async () => {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_SMS
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;

        const today = new Date().setHours(0, 0, 0, 0);

        const filter = {
            box: "",
            read: 1,
            using: "date",
            minDate: today,
        };

        SmsAndroid.list(JSON.stringify(filter), (fail) => {
            console.log("Failed", fail);
        }, (count, smsList) => {
            const messages = JSON.parse(smsList);

            setFormData((prev) => ({
                ...prev,
                messages_received: messages.filter((m) => m.type === 1).length.toString(),
                messages_sent: messages.filter((m) => m.type === 2).length.toString(),
            }));
        });
    };

    const getTodayStats = async () => {
        await getTodayCallLogs();
        await getTodaySMS();
    };

    const today = new Date();

    const SubmitData = () => {
        Flask.post('/predict', formData).then((res) => {
            const ob = {
                user_email: userDetails.RegisterdUser.email,
                calls_incoming: formData.calls_incoming,
                face_mood: faceMood,
                messages_received: formData.messages_received,
                messages_sent: formData.messages_sent,
                sleep_hours: formData.sleep_hours,
                predicted_label: res.data.predicted_label,
                date: today,
                probabilities: res.data.probabilities
            }
            console.log(res.data.predicted_label)

            const ai = {
                stress_level: res.data.predicted_label
            }
            console.log(ai)
            FlaskSocial.post('/social/ai', ai).then((res) => {
                console.log(res.data)
                setAiPredict(res.data)
            }).catch((err) => {
                console.log(err)
            })

            setPredictResult(res.data.predicted_label)
            setPredictResult2(res.data.probabilities)
            Node.post('/soical/add', ob).then((res) => {
                console.log(res.data)
            }).catch((err) => {
                console.log(err)
            })

            const ob2 = {
                suffer_email: userDetails.RegisterdUser.email,
                level: res.data.predicted_label
            }

            Node.post('/notify/add', ob2).then((res) => {
                console.log(res.data)
            }).catch((err) => {
                console.log(err)
            })

        }).catch((err) => {
            console.log(err)
        })
    }

    const cleanText = (text) => {
        if (!text) return "";

        return text
            .replace(/##/g, "")        // remove headings
            .replace(/\*\*/g, "")      // remove bold
            .replace(/\*/g, "")        // remove *
            .replace(/---/g, "")       // remove separators
            .replace(/\n/g, "\n\n")    // add spacing for readability
            .trim();
    };

    const cleanSinhalaSpeech = (text) => {
        if (!text) return "";

        return text
            .replace(/###/g, "")
            .replace(/\*\*\*/g, "")
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .replace(/\"/g, "")
            .replace(/-/g, " ")
            .replace(/\n/g, " ")
            .replace(/4/g, " හතර ")
            .replace(/7/g, " හත ")
            .replace(/8/g, " අට ")
            .replace(/\s+/g, " ")
            .trim();
    };
    const speakSinhala = (text) => {
        const cleaned = cleanSinhalaSpeech(text);

        Speech.speak(cleaned, {
            language: "si-LK",
            rate: 0.85,
    pitch: 1.0
        });
    };

    const stopSpeech = () => {
        Speech.stop();
    };

    // ---------------------- UI ----------------------
    return (
        <LinearGradient colors={["#ffffff", "#f6efe7"]} style={styles.container}>
            <Header />

            <ScrollView contentContainerStyle={styles.contentContainer}>
                {/* Auto Fetch Button */}


                {/* Title */}
                <Text style={styles.title}>Daily Stress Predictor</Text>

                <TouchableOpacity onPress={getTodayStats} style={styles.fetchButton}>
                    <Text style={styles.fetchButtonText}>Auto Fill Today Data</Text>
                </TouchableOpacity>

                {/* Card */}
                <View style={styles.card}>
                    {/* Capture Image */}
                    <TouchableOpacity style={styles.buttonPrimary} onPress={takePhoto}>
                        <FontAwesome name="camera" size={18} color="#fff" />
                        <Text style={styles.buttonPrimaryText}>Capture Face Image</Text>
                    </TouchableOpacity>

                    {selectedImage && (
                        <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                    )}

                    {/* Input Fields */}
                    {[
                        { placeholder: faceMood, key: "face_mood" },
                        { placeholder: "Messages Sent", key: "messages_sent" },
                        { placeholder: "Messages Received", key: "messages_received" },
                        { placeholder: "Incoming Calls", key: "calls_incoming" },
                        { placeholder: "Outgoing Calls", key: "calls_outgoing" },
                        { placeholder: "Sleep Hours", key: "sleep_hours" },
                    ].map((field) => (
                        <TextInput
                            key={field.key}
                            placeholder={field.placeholder}
                            style={styles.input}
                            value={formData[field.key]}
                            keyboardType="numeric"
                            onChangeText={(text) =>
                                setFormData({ ...formData, [field.key]: text })
                            }
                        />
                    ))}

                    {/* Buttons */}
                    <TouchableOpacity style={styles.buttonSubmit} onPress={SubmitData}>
                        <Text style={styles.buttonText}>Submit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.buttonCancel}>
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>

                    {predictResult !== "" && (
                        <View style={styles.resultCard}>
                            <Text style={styles.resultTitle}>Your Stress Prediction</Text>

                            <Text style={styles.resultLabel}>
                                🔍 Predicted Stress Level:
                                <Text style={styles.resultValue}> {predictResult}</Text>
                            </Text>

                            <View style={styles.probBox}>
                                <Text style={styles.probTitle}>Probability Distribution</Text>

                                {Object.entries(predictResult2).map(([label, value]) => (
                                    <Text style={styles.probText} key={label}>
                                        • {label}: {(value * 100).toFixed(2)}%
                                    </Text>
                                ))}
                            </View>
                        </View>
                    )}

                    {aiPredict && (
                        <View style={styles.resultCard}>
                            <Text style={styles.resultTitle}>AI Recommendations</Text>

                            <Text style={styles.resultText}>
                                {cleanText(aiPredict.recommendations)}
                            </Text>

                            <Text style={styles.resultTitle}>සිංහල</Text>

                            <Text style={styles.resultText}>
                                {cleanText(aiPredict.trans)}
                            </Text>

                            <TouchableOpacity
                                style={styles.speakButton}
                                onPress={() => speakSinhala(aiPredict.recommendations)}
                            >
                                <Text style={styles.speakButtonText}>🔊 Listen in English</Text>
                            </TouchableOpacity>


                              <TouchableOpacity
                                style={styles.speakButton}
                                onPress={() => speakSinhala(aiPredict.trans)}
                            >
                                <Text style={styles.speakButtonText}>🔊 Listen in Sinhala</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.stopButton}
                                onPress={stopSpeech}
                            >
                                <Text style={styles.speakButtonText}>⏹ Stop</Text>
                            </TouchableOpacity>
                        </View>
                    )}


                </View>
            </ScrollView>

            <Footer />
        </LinearGradient>
    );
};

export default PredictStress;

// ---------------------- STYLES ----------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },

    title: {
        fontSize: 24,
        color: "#FF8C00",
        textAlign: "center",
        marginVertical: 20,
        fontWeight: "bold",
    },

    fetchButton: {
        backgroundColor: "#FF8C00",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        alignSelf: "center",
        marginBottom: 10,
        marginTop: 10,
        elevation: 3,
    },
    fetchButtonText: {
        color: "white",
        fontWeight: "bold",
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 15,
        padding: 20,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 12,
        marginVertical: 6,
        fontSize: 15,
    },

    imagePreview: {
        width: "100%",
        height: 220,
        borderRadius: 15,
        marginVertical: 10,
    },

    buttonPrimary: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#007bff",
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    buttonPrimaryText: {
        color: "#fff",
        marginLeft: 8,
        fontWeight: "bold",
    },

    buttonSubmit: {
        backgroundColor: "#FF8C00",
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
    },

    buttonCancel: {
        backgroundColor: "#999",
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
    },

    buttonText: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    resultCard: {
        backgroundColor: "#fff8e6",
        borderRadius: 15,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: "#ffd28a",
        elevation: 4,
    },

    resultTitle: {
        fontSize: 20,
        color: "#FF8C00",
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10,
    },

    resultLabel: {
        fontSize: 18,
        color: "#444",
        marginBottom: 10,
        textAlign: "center",
    },

    resultValue: {
        fontWeight: "bold",
        color: "#d35400",
    },

    probBox: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#ffe2b6",
    },

    probTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#d35400",
        marginBottom: 5,
    },

    probText: {
        fontSize: 15,
        color: "#555",
        marginVertical: 2,
    },
    speakButton: {
        backgroundColor: "#4CAF50",
        padding: 12,
        marginTop: 10,
        borderRadius: 10,
        alignItems: "center"
    },

    stopButton: {
        backgroundColor: "#e53935",
        padding: 12,
        marginTop: 10,
        borderRadius: 10,
        alignItems: "center"
    },

    speakButtonText: {
        color: "white",
        fontWeight: "bold"
    }
});

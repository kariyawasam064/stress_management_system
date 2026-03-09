import React, { useState, useContext, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { AuthContext } from "../context/AuthContext";
import Node from "../api/node/Node";
import Fast from "../api/fast/Fast";

const StudyTimeTable = () => {
    const { userDetails } = useContext(AuthContext);
    const navigation = useNavigation();

    const [events, setEvents] = useState({});
    const [myLectures, setMyLectures] = useState([]);
    const [perDayHours, setPerDayHours] = useState("");
    const [preferTime, setPreferTime] = useState("");
    const [valueHas, setValueHas] = useState(false);

    const today = new Date();

    // -------------------------
    // LOAD EXISTING DATA
    // -------------------------
    useEffect(() => {
        // Load unavailable dates
        Node.get(`/date/get/${userDetails.RegisterdUser.email}`)
            .then((res) => {
                const formattedEvents = {};
                res.data.forEach((item) => {
                    formattedEvents[item.date] = {
                        customStyles: {
                            container: {
                                backgroundColor:
                                    item.reason === "Lecture"
                                        ? "#4CAF50"
                                        : item.reason === "Work"
                                            ? "#2196F3"
                                            : "#FF8C00",
                                borderRadius: 8,
                            },
                            text: {
                                color: "white",
                                fontWeight: "bold",
                            },
                        },
                        note: `${item.reason} (${item.time})`,
                    };
                });
                setEvents(formattedEvents);
            })
            .catch((err) => console.log(err));

        // Load lectures
        Node.get(`/lecture/get/${userDetails.RegisterdUser.email}`)
            .then((res) => setMyLectures(res.data || []))
            .catch((err) => console.log(err));

        // Check if timetable already exists
        Node.get(`/timetable/get/${userDetails.RegisterdUser.email}`)
            .then((res) => {
                if (res.data && res.data.schedule && res.data.schedule.length > 0) {
                    setValueHas(true);
                }
            })
            .catch(() => setValueHas(false));
    }, []);

    // -------------------------
    // PREDICT MODEL
    // -------------------------
    const predictModel = () => {
        if (!perDayHours || !preferTime) {
            alert("Please fill all the fields.");
            return;
        }

        const payload = {
            subjects: myLectures,
            unavailable: events,
            study_hours_per_day: perDayHours,
            preferred_window: preferTime,
            year: today.getFullYear(),
            month: today.getMonth() + 1,
        };

        Fast.post("/generate_timetable", payload)
            .then((res) => {
                const body = {
                    per_subject_sessions: res.data.per_subject_sessions,
                    schedule: res.data.schedule,
                    owner_email: userDetails.RegisterdUser.email,
                };

                Node.post("/timetable/add", body)
                    .then(() => {
                        alert("Timetable saved successfully!");
                        setValueHas(true);
                    })
                    .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
    };


    const generateTimetables = () => {
        if (!perDayHours || !preferTime) {
            alert("Please fill all the fields.");
            return;
        }

        const payload = {
            subjects: myLectures,
            unavailable: events,
            study_hours_per_day: perDayHours,
            preferred_window: preferTime,
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            owner_email: userDetails.RegisterdUser.email
        };

        Fast.post("/generate_timetables", payload)
            .then(() => {
                alert("3 Timetables generated successfully!");
                setValueHas(true);
            })
            .catch((err) => console.log(err));
    };
    return (
        <LinearGradient colors={["#ffffff", "#f3ddc3"]} style={styles.container}>
            <Header />

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.heading}>Study Timetable</Text>

                {valueHas && (
                    <Text style={styles.existingText}>
                        ✔ You already have a generated timetable
                    </Text>
                )}

                <Text style={styles.descriptionText}>
                    30 minutes study, 15 minutes break. Build your ML-generated timetable!
                </Text>

                {/* Input: hours per day */}
                <Text style={styles.label}>Study hours per day</Text>
                <TextInput
                    placeholder="Enter hours"
                    keyboardType="numeric"
                    value={perDayHours}
                    onChangeText={setPerDayHours}
                    style={styles.input}
                />
                

                {/* Picker */}
                <Text style={styles.label}>Preferred study time</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={preferTime}
                        onValueChange={(v) => setPreferTime(v)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select" value="" />
                        <Picker.Item label="Morning" value="morning" />
                        <Picker.Item label="Afternoon" value="afternoon" />
                        <Picker.Item label="Night" value="night" />
                        <Picker.Item label="Flexible" value="flexible" />
                    </Picker>
                </View>

                <TouchableOpacity style={styles.button} onPress={generateTimetables}>
                    <Text style={styles.buttonText}>Generate Timetable</Text>
                </TouchableOpacity>
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
        paddingTop: 20,
    },
    existingText: {
        textAlign: "center",
        color: "#4CAF50",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 15,
    },
    descriptionText: {
        fontSize: 15,
        color: "#666",
        textAlign: "center",
        marginBottom: 25,
    },
    label: {
        fontWeight: "600",
        color: "#333",
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: "#bbb",
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: "#bbb",
        borderRadius: 8,
        marginBottom: 20,
    },
    picker: {
        height: 150,
        width: "100%",
    },
    button: {
        backgroundColor: "#FF8C00",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default StudyTimeTable;

import React, { useState, useContext, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Modal,
    Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { AuthContext } from "../context/AuthContext";
import Node from "../api/node/Node";

const AcademicsDashboard = () => {
    const { userDetails } = useContext(AuthContext);
    const navigation = useNavigation();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [eventNote, setEventNote] = useState("");
    const [eventTime, setEventTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [events, setEvents] = useState({});

    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    useEffect(() => {
        Node.get(`/date/get/${userDetails.RegisterdUser.email}`)
            .then((res) => {
                console.log(res.data);

                // Convert response to calendar format
                const formattedEvents = {};
                res.data.forEach((item) => {
                    formattedEvents[item.date] = {
                        customStyles: {
                            container: {
                                backgroundColor:
                                    item.reason === "Lecture"
                                        ? "#4CAF50" // Green for lectures
                                        : item.reason === "Work"
                                            ? "#2196F3" // Blue for work
                                            : "#FF8C00", // Orange default
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
            .catch((err) => {
                console.log(err);
            });
    }, []);



    // Handle day press
    const handleDayPress = (day) => {
        setSelectedDate(day.dateString);
        setModalVisible(true);
    };

    // Add event to calendar
    const handleAddEvent = () => {
        if (!selectedDate || !eventNote) return;

        const updatedEvents = {
            ...events,
            [selectedDate]: {
                marked: true,
                customStyles: {
                    container: { backgroundColor: "#ffe6b3" },
                    text: { color: "#d35400", fontWeight: "bold" },
                },
                note: `${eventNote} (${startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })} - ${endTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })})`,

            },
        };

        const ob = {
            date: selectedDate,
            reason: eventNote,
            time: ` ${startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })} - ${endTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })}`,
            email: userDetails.RegisterdUser.email
        }

        Node.post('/date/add', ob).then((res) => {
            console.log(res.data)
        }).catch((err) => {
            console.log(err)
        })

        setEvents(updatedEvents);
        setModalVisible(false);
        setEventNote("");
        setEventTime(new Date());
    };

    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    return (
        <LinearGradient colors={["#ffffffff", "#f3ddc3ff"]} style={styles.container}>
            <Header />

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.heading}>Academic Stress</Text>

                <Calendar
                    markingType={"custom"}
                    markedDates={events}
                    onDayPress={handleDayPress}
                    theme={{
                        calendarBackground: "white",
                        textSectionTitleColor: "#2E3A59",
                        todayTextColor: "#f57c00",
                        dayTextColor: "#2E3A59",
                        arrowColor: "#f57c00",
                        monthTextColor: "#f57c00",
                    }}
                    style={{ borderRadius: 10, margin: 10, elevation: 3 }}
                />

                {/* Display all events below calendar */}
                <View style={{ margin: 10 }}>
                    {Object.keys(events).filter((dateStr) => {
                        const d = new Date(dateStr);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    }).length === 0 && (
                            <Text style={{ textAlign: "center", color: "#555" }}>No events added yet.</Text>
                        )}

                    {Object.keys(events)
                        .filter((dateStr) => {
                            const d = new Date(dateStr);
                            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                        })
                        .map((date) => (
                            <Text key={date} style={styles.eventNote}>
                                📅 {date} → {events[date].note}
                            </Text>
                        ))}
                </View>
                {/* Bottom buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate("LectureInfo")}
                    >
                        <FontAwesome name="video-camera" size={28} color="#FF8C00" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate("MLGeneratedTimetable")}>
                        <FontAwesome name="book" size={28} color="#FF8C00" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate("StudyTimeTable")}
                    >
                        <FontAwesome name="calendar" size={28} color="#FF8C00" />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal for adding events */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "white",
                            padding: 20,
                            borderRadius: 10,
                            width: "80%",
                        }}
                    >
                        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
                            Add Event for {selectedDate}
                        </Text>

                        {/* Reason dropdown */}
                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 8,
                                marginBottom: 15,
                                overflow: "hidden",
                            }}
                        >
                            <Picker
                                selectedValue={eventNote}
                                onValueChange={(itemValue) => setEventNote(itemValue)}
                                style={{ height: 150, width: "100%" }}
                            >
                                <Picker.Item label="Select Reason" value="" />
                                <Picker.Item label="Lecture" value="Lecture" />
                                <Picker.Item label="Assignment" value="Assignment" />
                                <Picker.Item label="Work" value="Work" />
                                <Picker.Item label="Class" value="Class" />
                                <Picker.Item label="Entertainment" value="Entertainment" />
                                <Picker.Item label="Other" value="Other" />
                            </Picker>
                        </View>

                        {/* Start Time Picker */}
                        <TouchableOpacity
                            onPress={() => setShowStartTimePicker(true)}
                            style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 8,
                                padding: 10,
                                marginBottom: 15,
                            }}
                        >
                            <Text>
                                Start Time:{" "}
                                {startTime
                                    ? startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                    : "Select Start Time"}
                            </Text>
                        </TouchableOpacity>

                        {showStartTimePicker && (
                            <DateTimePicker
                                value={startTime || new Date()}
                                mode="time"
                                display="default"
                                onChange={(event, selectedTime) => {
                                    setShowStartTimePicker(false);
                                    if (selectedTime) setStartTime(selectedTime);
                                }}
                            />
                        )}

                        {/* End Time Picker */}
                        <TouchableOpacity
                            onPress={() => setShowEndTimePicker(true)}
                            style={{
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 8,
                                padding: 10,
                                marginBottom: 15,
                                marginTop: 5
                            }}
                        >
                            <Text>
                                End Time:{" "}
                                {endTime
                                    ? endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                    : "Select End Time"}
                            </Text>
                        </TouchableOpacity>

                        {showEndTimePicker && (
                            <DateTimePicker
                                value={endTime || new Date()}
                                mode="time"
                                display="default"
                                onChange={(event, selectedTime) => {
                                    setShowEndTimePicker(false);
                                    if (selectedTime) setEndTime(selectedTime);
                                }}
                            />
                        )}


                        {/* Modal buttons */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <TouchableOpacity
                                onPress={handleAddEvent}
                                style={{ backgroundColor: "#FF8C00", padding: 10, borderRadius: 8 }}
                            >
                                <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={{ backgroundColor: "#aaa", padding: 10, borderRadius: 8 }}
                            >
                                <Text style={{ color: "white" }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        marginTop: 20,
        paddingVertical: 10,
    },

    iconButton: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        width: 100,
        elevation: 3, // adds shadow on Android
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 1, height: 2 },
        shadowRadius: 4,
    },

    buttonLabel: {
        marginTop: 5,
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },

});

export default AcademicsDashboard;

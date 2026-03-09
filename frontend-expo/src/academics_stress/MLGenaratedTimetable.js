import React, { useState, useContext, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { AuthContext } from "../context/AuthContext";
import Node from "../api/node/Node";
import Fast from "../api/fast/Fast";

const MLGenaratedTimeTable = () => {
    const { userDetails } = useContext(AuthContext);

    const [timetables, setTimetables] = useState([]);        // All 3 timetables
    const [selectedType, setSelectedType] = useState(1);     // Current timetable type
    const [events, setEvents] = useState({});                // Calendar markings
    const [scheduleByDate, setScheduleByDate] = useState({});// Sessions grouped by date
    const [selectedDate, setSelectedDate] = useState("");     // Current selected date
    const today = new Date().toISOString().split("T")[0];     // YYYY-MM-DD

    useEffect(() => {
        // Load all 3 timetables
        Fast.get(`/timetable/get_all/${userDetails.RegisterdUser.email}`)
            .then((res) => {
                setTimetables(res.data.timetables || []);
                // Load first timetable by default
                if (res.data.timetables.length > 0) {
                    loadTimetable(res.data.timetables[0].type);
                }
            })
            .catch((err) => console.log("Error fetching timetables:", err));
    }, []);

    const loadTimetable = (type) => {
        setSelectedType(type);
        const timetable = timetables.find(t => t.type === type);
        if (!timetable) return;

        const schedule = timetable.schedule || [];

        // Group by date
        const grouped = {};
        schedule.forEach((item) => {
            if (!grouped[item.date]) grouped[item.date] = [];
            grouped[item.date].push(item);
        });
        setScheduleByDate(grouped);

        // Calendar marking
        const marks = {};
        Object.keys(grouped).forEach((date) => {
            marks[date] = {
                marked: true,
                dotColor: "#f57c00",
                selected: date === today,
                selectedColor: "#ffd9b3"
            };
        });
        setEvents(marks);

        // Default selected date
        setSelectedDate(today);
    };

    const handleDayPress = (day) => {
        setSelectedDate(day.dateString);
    };

    return (
        <LinearGradient colors={["#ffffffff", "#f3ddc3ff"]} style={styles.container}>
            <Header />
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.heading}>My Timetable</Text>

                {/* Timetable selector */}
                <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
                    {[1, 2, 3].map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.typeButton,
                                selectedType === t && { backgroundColor: "#f57c00" }
                            ]}
                            onPress={() => loadTimetable(t)}
                        >
                            <Text style={{ color: "white" }}>Timetable {t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Calendar */}
                <Calendar
                    markingType="dot"
                    markedDates={{
                        ...events,
                        [selectedDate]: {
                            selected: true,
                            selectedColor: "#f57c00",
                            marked: events[selectedDate]?.marked,
                            dotColor: "#fff"
                        }
                    }}
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

                {/* Selected date label */}
                <Text style={styles.selectedDateText}>📅 {selectedDate}</Text>

                {/* Display schedule for selected date */}
                <View style={styles.eventBox}>
                    {scheduleByDate[selectedDate] ? (
                        scheduleByDate[selectedDate].map((item, index) => (
                            <View key={index} style={styles.eventCard}>
                                <Text style={styles.eventTitle}>{item.lecture_name}</Text>
                                <Text style={styles.eventDetail}>Module: {item.module_name}</Text>
                                <Text style={styles.eventDetail}>Time: {item.start_time} → {item.end_time}</Text>
                                <Text style={styles.eventDetail}>Priority: {item.priority}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noEventText}>No events for this date.</Text>
                    )}
                </View>
            </ScrollView>
            <Footer />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 30, },
    contentContainer: { paddingBottom: 100 },
    heading: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
    selectedDateText: { textAlign: "center", fontSize: 18, marginVertical: 5 },
    eventBox: { marginHorizontal: 15, marginTop: 10 },
    eventCard: { backgroundColor: "#fff", padding: 10, marginBottom: 10, borderRadius: 8, elevation: 2 },
    eventTitle: { fontSize: 16, fontWeight: "bold" },
    eventDetail: { fontSize: 14 },
    noEventText: { textAlign: "center", color: "#888", fontStyle: "italic" },
    typeButton: { backgroundColor: "#2E3A59", padding: 10, borderRadius: 5, width: 100, alignItems: "center" },
});

export default MLGenaratedTimeTable;
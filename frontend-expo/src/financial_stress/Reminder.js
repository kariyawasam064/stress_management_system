import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  StyleSheet,
  Keyboard,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Node from "../api/node/Node";
import { AuthContext } from "../context/AuthContext";
import Footer from "../pages/Footer";
import Icon from "react-native-vector-icons/Feather";
import Header from "../pages/Header";

const frequencies = ["once", "daily", "weekly", "monthly"];

const Reminder = () => {
  const { userDetails } = useContext(AuthContext);

  const [reminders, setReminders] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [frequency, setFrequency] = useState("once");
  const [loading, setLoading] = useState(false);

  // Fetch Reminders
  const fetchReminders = async () => {
    if (!userDetails) return;
    try {
      setLoading(true);
      const email = userDetails.RegisterdUser.email;
      const response = await Node.get(`/reminder/user/${email}`);
      setReminders(response.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  // Add Reminder
  const handleAddReminder = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Title is required!");
      return;
    }

    try {
      const payload = {
        title,
        description,
        dueDate,
        frequency,
        email: userDetails.RegisterdUser.email,
      };

      const response = await Node.post("/reminder/add", payload);

      Alert.alert("Success", response.data.message);

      setTitle("");
      setDescription("");
      setDueDate(new Date());
      setFrequency("once");

      fetchReminders();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || error.message);
    }
  };

  // Delete Reminder
  const handleDeleteReminder = async (id) => {
    Alert.alert("Delete Reminder", "Do you want to delete this reminder?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await Node.delete(`/reminder/delete/${id}`);
            fetchReminders();
          } catch (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  // Render single reminder
  const renderReminder = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.title}</Text>

        {item.description ? (
          <Text style={styles.cardDesc}>{item.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Icon name="clock" size={16} color="#FF8C00" />
          <Text style={styles.cardMeta}>
            {new Date(item.dueDate).toLocaleString()}
          </Text>
          <Text style={styles.cardMeta}> | {item.frequency}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleDeleteReminder(item._id)}
        style={styles.deleteBtn}
      >
        <Icon name="trash-2" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={["#ffffff", "#f3ddc3"]} style={{ flex: 1 }}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Reminders</Text>
        <Text style={styles.descriptionText}>
          Stay on top of your schedule.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            placeholder="Reminder Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <TextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, { height: 80 }]}
          />

          {/* Date Button */}
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              setShowDatePicker(true);
            }}
            style={styles.dateBtn}
          >
            <Icon name="calendar" size={18} color="#FF8C00" />
            <Text style={styles.dateBtnText}>{dueDate.toLocaleString()}</Text>
          </TouchableOpacity>

          {/* Modal Date Picker */}
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="datetime"
            onConfirm={(date) => {
              setDueDate(date);
              setShowDatePicker(false);
            }}
            onCancel={() => setShowDatePicker(false)}
          />

          {/* Frequencies */}
          <View style={styles.freqRow}>
            {frequencies.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFrequency(f)}
                style={[
                  styles.freqBtn,
                  frequency === f && styles.freqBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.freqText,
                    frequency === f && styles.freqTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddReminder}>
            <Text style={styles.addBtnText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subHeading}>Your Reminders</Text>

        {loading ? (
          <Text style={styles.noData}>Loading...</Text>
        ) : reminders.length === 0 ? (
          <Text style={styles.noData}>No reminders yet.</Text>
        ) : (
          <FlatList
            data={reminders}
            renderItem={renderReminder}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      <Footer />
    </LinearGradient>
  );
};

export default Reminder;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF8C00",
    textAlign: "center",
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  subHeading: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 30,
    color: "#333",
  },
  form: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 15,
  },

  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  dateBtnText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#FF8C00",
  },

  freqRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },

  freqBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#eee",
  },

  freqBtnActive: {
    backgroundColor: "#FF8C00",
    elevation: 3,
  },

  freqText: {
    color: "#333",
    fontWeight: "500",
  },

  freqTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  addBtn: {
    backgroundColor: "#FF8C00",
    padding: 14,
    borderRadius: 14,
    marginTop: 10,
  },

  addBtnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  /* Reminder Cards */
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    flexDirection: "row",
  },

  cardTitle: { fontSize: 17, fontWeight: "700", color: "#222" },

  cardDesc: { marginTop: 4, fontSize: 14, color: "#555" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  cardMeta: {
    fontSize: 12,
    color: "#777",
    marginLeft: 6,
  },

  deleteBtn: {
    justifyContent: "center",
    paddingLeft: 12,
  },

  noData: {
    textAlign: "center",
    marginVertical: 20,
    color: "#777",
  },
});

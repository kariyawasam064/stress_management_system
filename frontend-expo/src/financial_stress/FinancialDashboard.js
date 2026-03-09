import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import Node from "../api/node/Node";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import {
  FontAwesome6,
  Ionicons,
  Foundation,
  MaterialIcons,
} from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import MonthlyBalanceChart from "./MonthlyBalanceChart";

const FinancialDashboard = () => {
  const { userDetails } = useContext(AuthContext);
  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [events, setEvents] = useState({});
  const [activeTab, setActiveTab] = useState("All");
  const [monthlyTransaction, setMonthlyTransaction] = useState(null);

  const monthName = new Date().toLocaleString("en-US", { month: "long" });

  const [deletingId, setDeletingId] = useState(null);

  const deleteData = (item) => {
    if (!item || !item._id) {
      Alert.alert("Error", "Invalid item selected for deletion.");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            setDeletingId(item._id);
            try {
              const response = await Node.delete(
                `/transaction/remove/${item._id}`
              );

              console.log("Delete response:", response?.data ?? response);

              setEvents((prev) => {
                if (!prev) return prev;
                const updated = { ...prev };
                const listForDate = Array.isArray(updated[item.date])
                  ? updated[item.date].filter((i) => i._id !== item._id)
                  : [];

                if (listForDate.length === 0) {
                  delete updated[item.date];
                } else {
                  updated[item.date] = listForDate;
                }
                return updated;
              });

              Node.get(
                `/transaction/all/${userDetails.RegisterdUser.email}`
              ).then((res) => {
                const formatted = {};
                res.data.forEach((item) => {
                  if (!formatted[item.date]) formatted[item.date] = [];
                  formatted[item.date].push(item);
                });
                fetchMonthlySummary();
                setEvents(formatted);
              });

              Alert.alert("Success", "Deleted successfully");
            } catch (err) {
              const serverMsg =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Unknown error";

              Alert.alert("Delete Failed", String(serverMsg));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  //Fetch monthly total transaction
  const fetchMonthlySummary = async () => {
    try {
      const res = await Node.get(
        `/transaction/monthly/${userDetails.RegisterdUser.email}`
      );
      setMonthlyTransaction(res.data);
    } catch (err) {
      console.log("Summary fetch error:", err);
    }
  };
  useEffect(() => {
    fetchMonthlySummary();
  }, []);

  // Fetch all transaction events
  useEffect(() => {
    Node.get(`/transaction/all/${userDetails.RegisterdUser.email}`)
      .then((res) => {
        const formattedEvents = {};
        res.data.forEach((item) => {
          if (!formattedEvents[item.date]) formattedEvents[item.date] = [];
          formattedEvents[item.date].push({
            _id: item._id,
            type: item.type,
            note: item.note,
            category: item.category,
            amount: item.amount,
          });
        });
        setEvents(formattedEvents);
      })
      .catch((err) => console.log(err));
  }, []);

  //get monthly balance
  const validateAndSave = () => {
    const amt = Number(amount);

    if (!amt || amt <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (type === "expense") {
      if (amt > monthlyTransaction?.balance?.total) {
        Alert.alert("Error", "Amount cannot be greater than your balance");
        return;
      }
    }
    handleAddTransaction();
  };

  // Filter events by tab
  const getFilteredEvents = () => {
    if (activeTab === "Today") {
      const today = new Date().toISOString().split("T")[0];
      return events[today] ? { [today]: events[today] } : {};
    }
    return events;
  };

  // Flatten events for FlatList
  const filteredEvents = getFilteredEvents();
  const flatData = [];
  Object.keys(filteredEvents).forEach((date) => {
    filteredEvents[date].forEach((item) => {
      flatData.push({ ...item, date });
    });
  });

  const openAddModal = () => {
    setModalVisible(true);
  };

  const handleAddTransaction = async () => {
    if (!type || !category || !amount) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const incomeData = {
      date: today,
      type,
      category,
      amount,
      note,
      email: userDetails.RegisterdUser.email,
    };
    try {
      const res = await Node.post("/transaction/add", incomeData);

      if (res.status === 201) {
        Alert.alert("Success", "Data Added Successfully!");

        setModalVisible(false);
        setType("");
        setCategory("");
        setAmount("");
        setNote("");

        Node.get(`/transaction/all/${userDetails.RegisterdUser.email}`).then(
          (res) => {
            const formatted = {};
            res.data.forEach((item) => {
              if (!formatted[item.date]) formatted[item.date] = [];
              formatted[item.date].push(item);
            });
            fetchMonthlySummary();
            setEvents(formatted);
          }
        );
      } else {
        Alert.alert("Error", "Backend error!");
      }
    } catch (error) {
      console.log("ERROR MESSAGE:", error.message);
      Alert.alert("Error", "Failed to add income");
    }
  };

  return (
    <LinearGradient
      colors={["#ffffffff", "#f3ddc3ff"]}
      style={styles.container}
    >
      <Header />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.heading}>Financial Stress</Text>

        {/* Bottom buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPressIn={() => {
              openAddModal();
            }}
          >
            <Ionicons name="add-circle" size={28} color="#FF8C00" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("SavingPlan")}
          >
            <FontAwesome6 name="money-check-dollar" size={28} color="#FF8C00" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("FinanceNotification")}
          >
            <Foundation name="alert" size={28} color="#FF8C00" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Reminder")}
          >
            <Ionicons name="alarm-sharp" size={28} color="#FF8C00" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginVertical: 10,
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("All")}
            style={{
              padding: 10,
              borderBottomWidth: activeTab === "All" ? 2 : 0,
              borderBottomColor: "#FF8C00",
              marginHorizontal: 5,
            }}
          >
            <Text>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("Today")}
            style={{
              padding: 10,
              borderBottomWidth: activeTab === "Today" ? 2 : 0,
              borderBottomColor: "#FF8C00",
              marginHorizontal: 5,
            }}
          >
            <Text>Today</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 250, margin: 10 }}>
          <ScrollView
            nestedScrollEnabled={true}
            contentContainerStyle={{ paddingVertical: 5 }}
          >
            {flatData.length === 0 ? (
              <Text style={{ textAlign: "center", color: "#555" }}>
                No data added yet.
              </Text>
            ) : (
              (activeTab === "All" ? [...flatData].reverse() : flatData).map(
                (item, index) => (
                  <View key={index} style={{ marginVertical: 4 }}>
                    {activeTab === "All" && (
                      <Text style={{ fontWeight: "bold" }}>
                        📅 {item.date} - {item.type.toUpperCase()}
                      </Text>
                    )}

                    <View
                      style={[
                        styles.row,
                        {
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          paddingVertical: 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text>
                          {activeTab === "Today" &&
                            `${item.type.toUpperCase()} - `}
                          {item.category} ({item.note})
                        </Text>
                        <Text style={{ fontWeight: "bold" }}>
                          Rs. {item.amount}
                        </Text>
                      </View>

                      <TouchableOpacity onPress={() => deleteData(item)}>
                        <MaterialIcons
                          name="delete-outline"
                          size={24}
                          color="#f95353ff"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              )
            )}
          </ScrollView>
        </View>

        {/* Monthly Total Transaction Section */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>
          {monthName} Summary
        </Text>
        <View style={styles.transactionRow}>
          {/* Income */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("IncomeSection")}
          >
            <Ionicons name="wallet" size={24} color="#f99010ff" />
            <Text style={styles.cardTitle}>Income</Text>
            <Text style={styles.cardAmount}>
              Rs.{monthlyTransaction?.income?.total ?? 0}
            </Text>
            <Text style={styles.cardSub}>
              {monthlyTransaction?.income?.count ?? 0} transactions
            </Text>
          </TouchableOpacity>

          {/* Monthly Expenses */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ExpensesSection")}
          >
            <FontAwesome6
              name="money-bill-transfer"
              size={24}
              color="#f57a74ff"
            />
            <Text style={styles.cardTitle}>Expenses</Text>

            <Text style={styles.cardAmountRed}>
              Rs.{monthlyTransaction?.expense?.total ?? 0}
            </Text>

            <Text style={styles.cardSub}>
              {monthlyTransaction?.expense?.count ?? 0} transactions
            </Text>
          </TouchableOpacity>

          {/* Monthly Balance */}
          <View style={styles.card}>
            <MaterialIcons name="account-balance" size={24} color="#58ce74ff" />
            <Text style={styles.cardTitle}>Balance</Text>

            <Text style={styles.cardAmountGreen}>
              Rs.{monthlyTransaction?.balance?.total ?? 0}
            </Text>
            <Text style={styles.cardSub}>Updated</Text>
          </View>
        </View>
        <Text style={[styles.sectionHeading, { marginTop: 30 }]}>
          Yearly Balance
        </Text>
        <View>
          <MonthlyBalanceChart email={userDetails.RegisterdUser.email} />
        </View>
      </ScrollView>

      {/* Modal for adding income */}
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
              Add Transaction
            </Text>

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
                selectedValue={type}
                onValueChange={(v) => setType(v)}
                style={{ height: 50, width: "100%" }}
              >
                <Picker.Item label="Select Type" value="" />
                <Picker.Item label="Income" value="income" />
                <Picker.Item label="Expenses" value="expense" />
              </Picker>
            </View>
            {/* Income Categories */}
            <View
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                marginBottom: 15,
                overflow: "hidden",
              }}
            >
              {type === "income" ? (
                <Picker
                  selectedValue={category}
                  onValueChange={(v) => setCategory(v)}
                  style={{ height: 50, width: "100%" }}
                >
                  <Picker.Item label="Select Category" value="" />
                  <Picker.Item label="Pocket Money" value="Pocket_Money" />
                  <Picker.Item label="Salary" value="Salary" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              ) : type === "expense" ? (
                <Picker
                  selectedValue={category}
                  onValueChange={(v) => setCategory(v)}
                  style={{ height: 50, width: "100%" }}
                >
                  <Picker.Item label="Select Category" value="" />
                  <Picker.Item
                    label="Tuition & Academic Fees"
                    value="Tuition & Academic Fees"
                  />
                  <Picker.Item label="Food & Meals" value="Food & Meals" />
                  <Picker.Item label="Transport" value="Transport" />
                  <Picker.Item label="Entertainment" value="Entertainment" />
                  <Picker.Item label="Shopping" value="Shopping" />
                  <Picker.Item label="Accommodation" value="Accommodation" />
                  <Picker.Item
                    label="Health & Fitness"
                    value="Health & Fitness"
                  />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              ) : (
                <Picker
                  selectedValue={category}
                  onValueChange={(v) => setCategory(v)}
                  style={{ height: 50, width: "100%" }}
                >
                  <Picker.Item label="Select Category" value="" />
                </Picker>
              )}
            </View>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Rs."
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Enter your note here..."
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={validateAndSave}
                style={{
                  backgroundColor: "#FF8C00",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  backgroundColor: "#aaa",
                  padding: 10,
                  borderRadius: 8,
                }}
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
  container: { flex: 1, paddingTop: 30 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  heading: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF8C00",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    paddingTop: 40,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000ff",
    marginTop: 7,
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    width: 80,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 5,
  },
  card: {
    backgroundColor: "#fff",
    width: 112,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: "center",
    elevation: 5,
  },
  cardTitle: {
    fontSize: 13,
    marginTop: 5,
    fontWeight: "600",
    color: "#444",
  },
  cardAmount: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: "bold",
    color: "#FF8C00",
  },
  cardAmountRed: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: "bold",
    color: "#FF3B30",
  },
  cardAmountGreen: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: "bold",
    color: "#28a745",
  },
  cardSub: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
});

export default FinancialDashboard;

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import Node from "../api/node/Node";
import Fast from "../api/fast/FastFinance";
import Footer from "../pages/Footer";
import Header from "../pages/Header";

const SavingPlan = () => {
  const { userDetails } = useContext(AuthContext);

  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState({});
  const [savingAmount, setSavingAmount] = useState("");
  const [mlResult, setMlResult] = useState(null);

  //Prefill current month income & expenses
  useEffect(() => {
    const fetchPrefill = async () => {
      try {
        const res = await Node.get(
          `/saving/prefill/${userDetails.RegisterdUser.email}`
        ); 
        setIncome(res.data.income);
        setExpenses(res.data.expenses);
      } catch (err) {
        console.log("Prefill error:", err);
        Alert.alert("Error", "Failed to fetch current month data.");
      }
    };
    fetchPrefill();
  }, []);

  //Submit to ML
  const handleSubmit = async () => {
    if (!savingAmount) {
      Alert.alert("Error", "Enter a saving amount");
      return;
    }

    try {
      const mlCategories = {
        "Tuition & Academic Fees": expenses["Tuition & Academic Fees"] || 0,
        "Food & Meals": expenses["Food & Meals"] || 0,
        Transport: expenses["Transport"] || 0,
        Entertainment: expenses["Entertainment"] || 0,
        Shopping: expenses["Shopping"] || 0,
        "Health & Fitness": expenses["Health & Fitness"] || 0,
        Others: expenses["Others"] || 0,
      };

      const payload = {
        income,
        expenses: mlCategories,
        saving_amount: Number(savingAmount),
      };

      const res = await Fast.post("/predict_savings", payload);

      setMlResult(res.data);
      Alert.alert("Success", "Prediction received!");
    } catch (err) {
      console.log("ML error:", err);
      Alert.alert("Error", "Failed to get prediction from ML");
    }
  };

  const formatTimeToSave = (months) => {
    const days = Math.round(months * 30);

    if (days < 7) return `${days} days`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      const remDays = days % 7;
      return `${weeks} Weeks ${remDays > 0 ? remDays + " Days" : ""}`;
    }

    const m = Math.floor(days / 30);
    const remDays = days % 30;
    return `${m} Months ${remDays > 0 ? remDays + " Days" : ""}`;
  };

  return (
    <LinearGradient colors={["#ffffff", "#fbe7d3"]} style={{ flex: 1 }}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Financial Roadmap</Text>
        <Text style={styles.descriptionText}>
          Set your savings target and optimize your budget
        </Text>

        {/* INCOME CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Month Income</Text>
          <Text style={styles.cardValue}>Rs. {income}</Text>
        </View>

        {/* EXPENSES CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Month Expenses</Text>
          {Object.keys(expenses).length === 0 ? (
            <Text style={styles.noData}>No expenses found</Text>
          ) : (
            Object.keys(expenses).map((cat) => (
              <View key={cat} style={styles.row}>
                <Text style={styles.rowLabel}>{cat}</Text>
                <Text style={styles.rowValue}>Rs. {expenses[cat]}</Text>
              </View>
            ))
          )}
        </View>

        {/* SAVING INPUT */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Target Saving Amount</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter saving amount - Rs."
            value={savingAmount}
            onChangeText={setSavingAmount}
          />
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Generate Plan</Text>
          </TouchableOpacity>
        </View>

        {/* ML RESULT */}
        {mlResult && (
          <View style={styles.card}>
            <Text style={styles.resultTitle}>Your Saving Prediction</Text>

            {/* Time to Save */}
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Time Required:</Text>
              <Text style={styles.resultValue}>
                {formatTimeToSave(mlResult.time_to_save_months)}
              </Text>
            </View>

            {/* Allocation */}
            <Text style={styles.sectionTitle}> {formatTimeToSave(mlResult.time_to_save_months)}Allocation</Text>
            {Object.keys(mlResult.allocation).map((cat) => (
              <View key={cat} style={styles.row}>
                <Text style={styles.rowLabel}>{cat}</Text>
                <Text style={styles.rowValue}>
                  Rs. {mlResult.allocation[cat]}
                </Text>
              </View>
            ))}

            {/* Weekly */}
            <Text style={styles.sectionTitle}>Weekly Plan</Text>
            {Object.keys(mlResult.weekly).map((cat) => (
              <View key={cat} style={styles.row}>
                <Text style={styles.rowLabel}>{cat}</Text>
                <Text style={styles.rowValue}>Rs. {mlResult.weekly[cat]}</Text>
              </View>
            ))}

            {/* 3-Month */}
            <Text style={styles.sectionTitle}>3-Month Projection</Text>
            {Object.keys(mlResult.three_month).map((cat) => (
              <View key={cat} style={styles.row}>
                <Text style={styles.rowLabel}>{cat}</Text>
                <Text style={styles.rowValue}>
                  Rs. {mlResult.three_month[cat]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Footer />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FF8C00",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 15,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
    color: "#444",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1caa3fff",
  },
  noData: {
    color: "#888",
    fontStyle: "italic",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 16,
    color: "#555",
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242ff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#FF8C00",
    padding: 14,
    borderRadius: 10,
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: "#444",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 6,
    color: "#FF8C00",
  },
});

export default SavingPlan;

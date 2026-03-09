import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Node from "../api/node/Node";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import * as Progress from "react-native-progress";
import { MaterialIcons, Entypo } from "@expo/vector-icons";

const FinanceNotification = () => {
  const { userDetails } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    fetchAIAnalysis();
  }, []);

  const fetchAIAnalysis = () => {
    setLoading(true);
    Node.get(`/transaction/analyze/${userDetails.RegisterdUser.email}`)
      .then((res) => setAiData(res.data))
      .catch((err) => {
        console.log(err);
        Alert.alert("Error", "Failed to fetch AI recommendations");
      })
      .finally(() => setLoading(false));
  };

  const getDynamicRedColor = (level) => {
    if (level < 20) return "#ffcccc";
    if (level < 50) return "#ff9999";
    if (level < 70) return "#ff6666";
    if (level < 90) return "#ff3b30";
    if (level <= 100) return "#cc0000";
    return "#990000";
  };

  return (
    <LinearGradient colors={["#ffffff", "#f3ddc3"]} style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI Financial Insights</Text>

        <Text style={styles.descriptionText}>
          AI-driven analysis to plan your finances effectively.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#ff9800" />
        ) : aiData ? (
          <>
            {/* Stress Level */}
            {aiData.stressLevel && (
              <View style={[styles.card, { marginTop: 10 }]}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="warning" size={22} color="#ff9800" />
                  <Text style={styles.cardTitle}>Stress Level</Text>
                </View>

                <Progress.Bar
                  progress={aiData.stressLevel / 100}
                  width={null}
                  height={14}
                  borderRadius={8}
                  color={getDynamicRedColor(aiData.stressLevel)}
                  borderWidth={0}
                  unfilledColor="#f2f2f2"
                />

                <Text style={styles.progressLabel}>
                  {aiData.stressLevel}% — {aiData.stressLevelLevel}
                </Text>
              </View>
            )}

            {/* Alerts */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="notifications" size={22} color="#ff9800" />
                <Text style={styles.cardTitle}>Alerts</Text>
              </View>

              {aiData.alerts?.length > 0 ? (
                aiData.alerts.map((alert, index) => (
                  <View key={index} style={styles.alertCard}>
                    <Entypo name="dot-single" size={20} color="#ff9800" />
                    <Text style={styles.alertText} numberOfLines={4}>
                      {typeof alert === "string"
                        ? alert
                        : JSON.stringify(alert)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noData}>No alerts detected.</Text>
              )}
            </View>

            {/* Recommendations */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recommendations</Text>
            </View>

            {aiData.recommendations?.length > 0 ? (
              aiData.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color="#ff9800"
                  />
                  <Text style={styles.recommendationText} numberOfLines={4}>
                    {typeof rec === "string"
                      ? rec
                      : `Category: ${rec.category || "N/A"} — Amount: ${
                          rec.amount ? "Rs " + rec.amount : "N/A"
                        }`}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No recommendations available.</Text>
            )}

            {/* High Spending Categories */}
            <View style={[styles.card, { marginTop: 10 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>High Spending Categories</Text>
              </View>

              <View style={styles.categoriesContainer}>
                {aiData.highSpendingCategories?.length > 0 ? (
                  aiData.highSpendingCategories.map((cat, idx) => (
                    <LinearGradient
                      key={idx}
                      colors={["#ffe7c4", "#ffd8a0"]}
                      style={styles.categoryBox}
                    >
                      <Text style={styles.categoryText}>{cat}</Text>
                    </LinearGradient>
                  ))
                ) : (
                  <Text style={styles.noData}>
                    No high spending categories found.
                  </Text>
                )}
              </View>
            </View>

            {/* Feedback */}
            {aiData.feedback && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="feedback" size={22} color="#ff9800" />
                  <Text style={styles.cardTitle}>Financial Feedback</Text>
                </View>
                <Text style={styles.feedbackText} numberOfLines={8}>
                  {aiData.feedback}
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.noData}>No AI data available.</Text>
        )}
      </ScrollView>

      <Footer />
    </LinearGradient>
  );
};

export default FinanceNotification;

const styles = StyleSheet.create({
  root: { flex: 1 },

  content: {
    padding: 18,
    paddingBottom: 140,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ff9800",
    textAlign: "center",
    marginBottom: 6,
  },

  descriptionText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 0.4,
    borderColor: "#f4c38a",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginLeft: 8,
  },

  progressLabel: {
    textAlign: "right",
    fontSize: 14,
    marginTop: 6,
    color: "#444",
    fontWeight: "600",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff5e6",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#ffce94",
  },

  alertText: {
    color: "#cc6b00",
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },

  /** Recommendations */
  recommendationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#ffd8a4",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  recommendationText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 6,
    flex: 1,
    lineHeight: 20,
  },

  /** Categories */
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  categoryBox: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
    marginRight: 10,
    marginBottom: 10,
    elevation: 2,
  },

  categoryText: {
    color: "#b04a00",
    fontSize: 14,
    fontWeight: "700",
  },

  /** Feedback */
  feedbackText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    fontStyle: "italic",
  },

  /** No Data */
  noData: {
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
  },
});

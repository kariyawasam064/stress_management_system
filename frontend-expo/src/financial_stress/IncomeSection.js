import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import Node from "../api/node/Node";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/Feather";

const IncomeSection = () => {
  const { userDetails } = useContext(AuthContext);

  const [incomeEvents, setIncomeEvents] = useState({});
  const [loadingIncome, setLoadingIncome] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [activeWeekTab, setActiveWeekTab] = useState("This Week");

  const [monthlyCategorySummary, setMonthlyCategorySummary] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Fetch all transactions
  const fetchAllIncome = () => {
    Node.get(`/transaction/all/${userDetails.RegisterdUser.email}`)
      .then((res) => {
        const formattedEvents = {};

        // Filter only income items
        const incomeOnly = res.data.filter((item) => item.type === "income");

        incomeOnly.forEach((item) => {
          if (!formattedEvents[item.date]) formattedEvents[item.date] = [];
          formattedEvents[item.date].push(item);
        });

        setIncomeEvents(formattedEvents);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoadingIncome(false));
  };

  // Fetch monthly category-wise summary
  const fetchMonthlyCategorySummary = () => {
    Node.get(`/transaction/monthly-income/${userDetails.RegisterdUser.email}`)
      .then((res) => setMonthlyCategorySummary(res.data))
      .catch((err) => console.log(err))
      .finally(() => setLoadingSummary(false));
  };

  useEffect(() => {
    fetchAllIncome();
    fetchMonthlyCategorySummary();
  }, []);

  const getFilteredEvents = () => {
    if (activeTab === "Today") {
      const today = new Date().toISOString().split("T")[0];
      return incomeEvents[today] ? { [today]: incomeEvents[today] } : {};
    }
    return incomeEvents;
  };

  const flatData = [];
  const filteredEvents = getFilteredEvents();
  Object.keys(filteredEvents).forEach((date) =>
    filteredEvents[date].forEach((item) => flatData.push(item))
  );

  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getDailyTotals = (data) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const totals = days.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});
    data.forEach((item) => {
      const d = new Date(item.date);
      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      totals[days[idx]] += Number(item.amount);
    });
    return { labels: days, values: Object.values(totals) };
  };

  const today = new Date();
  const thisMonday = getMonday(today);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  const thisWeekItems = flatData.filter(
    (item) => new Date(item.date) >= thisMonday && new Date(item.date) <= today
  );
  const lastWeekItems = flatData.filter(
    (item) =>
      new Date(item.date) >= lastMonday && new Date(item.date) < thisMonday
  );

  const chartData =
    activeWeekTab === "This Week"
      ? getDailyTotals(thisWeekItems)
      : getDailyTotals(lastWeekItems);

  const renderIncome = ({ item, idx }) => (
    <View key={item._id || idx} style={styles.incomeCard}>
      {activeTab === "All" && <Text style={styles.dateText}>{item.date}</Text>}
      <View style={styles.incomeRow}>
        <View style={styles.categoryWrapper}>
          <Icon
            name="dollar-sign"
            size={20}
            color="#4caf50"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.incomeText}>
            {item.category} ({item.note})
          </Text>
        </View>
        <Text style={styles.amountText}>Rs. {item.amount}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#ffffff", "#f3ddc3"]} style={{ flex: 1 }}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Income Summary</Text>
        <Text style={styles.descriptionText}>
          Monitor your income to plan your savings effectively.
        </Text>
        {/* Tabs */}
        <View style={styles.tabsRow}>
          {["All", "Today"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Income List */}
        {loadingIncome ? (
          <ActivityIndicator size="large" color="#4caf50" />
        ) : flatData.length === 0 ? (
          <Text style={styles.noDataText}>No income added yet.</Text>
        ) : (
          <View style={{ maxHeight: 5 * 80, marginBottom: 20 }}>
            <ScrollView nestedScrollEnabled={true}>
              {flatData
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((item, idx) => renderIncome({ item, idx }))}
            </ScrollView>
          </View>
        )}

        {/* Weekly Chart Tabs */}
        <View style={[styles.tabsRow, { marginTop: 40 }]}>
          {["This Week", "Last Week"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeWeekTab === tab && styles.activeTab]}
              onPress={() => setActiveWeekTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeWeekTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Line Chart */}
        <LineChart
          data={{
            labels: chartData.labels,
            datasets: [{ data: chartData.values, strokeWidth: 2 }],
          }}
          width={Dimensions.get("window").width - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#f0f0f0",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#4caf50" },
          }}
          bezier
          style={{ marginVertical: 16, borderRadius: 16 }}
        />

        {/* Monthly Category-wise Summary */}
        <Text style={[styles.subHeading, { marginTop: 40 }]}>
          Monthly Income Breakdown
        </Text>
        {loadingSummary ? (
          <ActivityIndicator size="large" color="#4caf50" />
        ) : Object.keys(monthlyCategorySummary).length > 0 ? (
          <View style={styles.alertsGrid}>
            {Object.keys(monthlyCategorySummary).map((cat) => (
              <View
                key={cat}
                style={[styles.alertBox, { borderLeftColor: "#4caf50" }]}
              >
                <View style={styles.alertHeader}>
                  <Icon name="pie-chart" size={20} color="#4caf50" />
                  <Text style={styles.categoryText}>{cat}</Text>
                </View>
                <Text style={styles.transactionText}>
                  {monthlyCategorySummary[cat].transactions} transactions
                </Text>
                <Text style={styles.amountText}>
                  Rs. {monthlyCategorySummary[cat].totalAmount}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>No data for this month</Text>
        )}
      </ScrollView>
      <Footer />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4caf50",
    textAlign: "center",
    marginVertical: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  subHeading: {
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 12,
    color: "#333",
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 6,
    backgroundColor: "#eee",
  },
  activeTab: {
    backgroundColor: "#4caf50",
    shadowColor: "#4caf50",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
  tabText: { fontSize: 16, color: "#333", fontWeight: "500" },
  activeTabText: { color: "#fff", fontWeight: "700" },
  noDataText: { textAlign: "center", color: "#777", marginVertical: 20 },
  incomeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dateText: { fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 6 },
  incomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryWrapper: { flexDirection: "row", alignItems: "center", width: "70%" },
  incomeText: { fontSize: 14, color: "#333" },
  alertsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  alertBox: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderLeftWidth: 4,
  },
  alertHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  categoryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginLeft: 8,
  },
  transactionText: { fontSize: 13, color: "#666", marginBottom: 4 },
  amountText: { fontSize: 16, fontWeight: "700", color: "#4caf50" },
});

export default IncomeSection;

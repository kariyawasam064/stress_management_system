import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../context/AuthContext";
import { LineChart } from "react-native-chart-kit";
import Footer from "../pages/Footer";
import Node from "../api/node/Node";
import Header from "../pages/Header";
import Icon from "react-native-vector-icons/Feather";

const ExpensesSection = () => {
  const { userDetails } = useContext(AuthContext);

  const [events, setEvents] = useState({});
  const [activeTab, setActiveTab] = useState("All");
  const [activeWeekTab, setActiveWeekTab] = useState("This Week");
  const [weeklyData, setWeeklyData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyCategoryData();
    fetchAllTransactions();
  }, []);

  const fetchWeeklyCategoryData = () => {
    Node.get(`/transaction/weekly-category/${userDetails.RegisterdUser.email}`)
      .then((res) => {
        setWeeklyData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchAllTransactions = () => {
    Node.get(`/transaction/all/${userDetails.RegisterdUser.email}`)
      .then((res) => {
        const formattedEvents = {};
        res.data.forEach((item) => {
          if (!formattedEvents[item.date]) formattedEvents[item.date] = [];
          formattedEvents[item.date].push(item);
        });
        setEvents(formattedEvents);
      })
      .catch((err) => console.log(err));
  };

  const getFilteredEvents = () => {
    if (activeTab === "Today") {
      const today = new Date().toISOString().split("T")[0];
      return events[today] ? { [today]: events[today] } : {};
    }
    return events;
  };

  const filteredEvents = getFilteredEvents();

  const flatData = [];
  Object.keys(filteredEvents).forEach((date) =>
    filteredEvents[date].forEach((item) => {
      if (item.type === "expense") flatData.push(item);
    })
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

  const renderTransaction = ({ item }) => (
    <View style={styles.expenseCard}>
      {activeTab === "All" && <Text style={styles.dateText}>{item.date}</Text>}
      <View style={styles.expenseRow}>
        <View style={styles.categoryWrapper}>
          <Icon
            name="tag"
            size={20}
            color="#FF8C00"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.expenseText}>
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
        <Text style={styles.heading}>Expenses Summary</Text>
        <Text style={styles.descriptionText}>
          A complete overview of your expenses across all periods.
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

        {/* Transaction List */}
        {flatData.length === 0 ? (
          <Text style={styles.noDataText}>No expenses added yet.</Text>
        ) : (
          <ScrollView
            style={{ maxHeight: 5 * 80, marginBottom: 20 }}
            nestedScrollEnabled={true}
          >
            {flatData
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((item, idx) => (
                <View key={item._id || idx}>
                  {renderTransaction({ item, idx })}
                </View>
              ))}
          </ScrollView>
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
            color: (opacity = 1) => `rgba(255, 140, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#FF8C00" },
          }}
          bezier
          style={{ marginVertical: 16, borderRadius: 16 }}
        />

        <Text style={[styles.subHeading, { marginTop: 40 }]}>
          Weekly Category Summary
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#FF8C00" />
        ) : (
          <View style={styles.alertsGrid}>
            {Object.keys(weeklyData).map((cat, idx) => (
              <View key={idx} style={styles.alertBox}>
                <View style={styles.alertHeader}>
                  <Icon name="pie-chart" size={20} color="#FF8C00" />
                  <Text style={styles.categoryText}>{cat}</Text>
                </View>
                <Text style={styles.transactionText}>
                  {weeklyData[cat].transactions} transactions
                </Text>
                <Text style={styles.amountText}>
                  Rs. {weeklyData[cat].totalAmount}
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF8C00",
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
    backgroundColor: "#FF8C00",
    shadowColor: "#FF8C00",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
  tabText: { fontSize: 16, color: "#333", fontWeight: "500" },
  activeTabText: { color: "#fff", fontWeight: "700" },
  noDataText: { textAlign: "center", color: "#777", marginVertical: 20 },
  expenseCard: {
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
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryWrapper: { flexDirection: "row", alignItems: "center", width: "70%" },
  alertsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },

  alertBox: {
    width: "48%", // two boxes per row
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
    borderLeftColor: "#FF8C00", // accent color to make it premium
  },

  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  categoryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginLeft: 8,
  },

  transactionText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },

  amountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF3B30",
  },
});

export default ExpensesSection;

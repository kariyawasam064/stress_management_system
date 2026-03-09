import React, { useState, useContext, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Linking,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { AuthContext } from "../context/AuthContext";
import Node from "../api/node/Node";
import { LineChart } from "react-native-chart-kit";

const ScoialDashboard = () => {
  const { userDetails } = useContext(AuthContext);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const [prevRecords, setPrevRecords] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [chartData, setChartData] = useState([]);

  // New States
  const [videos, setVideos] = useState([]);
  const [stressLevel, setStressLevel] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const labelToValue = { Low: 1, Medium: 2, High: 3 };
  const valueToLabel = { 1: "Low", 2: "Medium", 3: "High" };

  useEffect(() => {
    Node.get(`/soical/get/${userDetails.RegisterdUser.email}`)
      .then((res) => {
        const data = res.data.data;
        setPrevRecords(data);

        const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));

        const values = sorted.map((item) => labelToValue[item.predicted_label]);
        const labels = sorted.map((item) => {
          const d = new Date(item.date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        });

        setChartLabels(labels);
        setChartData(values);
      })
      .catch((err) => console.log(err));
  }, []);

  const chartHeight = (width - 40) * 0.7;

  //CLICK HANDLER FOR GRAPH POINT
  const handlePointClick = () => {
    Node.get(`/soical/videos/${userDetails.RegisterdUser.email}`)
      .then((res) => {
        setStressLevel(res.data.stressLevel);
        setVideos(res.data.videos);
        setModalVisible(true);
      })
      .catch((err) => console.log(err));
  };

  return (
    <LinearGradient
      colors={["#ffffffff", "#f3ddc3ff"]}
      style={styles.container}
    >
      <Header />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.heading}>Social Monitor</Text>

        {/* Display chart */}
        <View style={{ margin: 10 }}>
          {chartData.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.title}>Stress Level Last 7 Days</Text>

              <LineChart
                data={{
                  labels: chartLabels,
                  datasets: [{ data: chartData }],
                }}
                width={width - 40}
                height={chartHeight}
                yAxisInterval={1}
                segments={2}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#fbe8d3",
                  backgroundGradientTo: "#f0c9a7",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 120, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#ffa726",
                  },
                }}
                style={styles.chart}
                bezier
                onDataPointClick={handlePointClick}
              />
            </View>
          )}
        </View>

        {/* Bottom buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("FriendDashboard")}
          >
            <FontAwesome name="user" size={28} color="#FF8C00" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("PredictStress")}
          >
            <FontAwesome name="search" size={28} color="#FF8C00" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("SocailNotification")}
          >
            <FontAwesome name="calendar" size={28} color="#FF8C00" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Footer />

      {/* --------------------------------------------
          VIDEO MODAL 
      -------------------------------------------- */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Suggested Videos for {stressLevel} Stress
            </Text>

            {videos.map((v, i) => (
              <TouchableOpacity
                key={i}
                style={styles.videoCard}
                onPress={() => Linking.openURL(v.url)}
              >
                <Image
                  source={{ uri: v.thumbnail }}
                  style={{ width: 100, height: 70, borderRadius: 10 }}
                />
                <Text style={{ flex: 1, paddingLeft: 10 }}>{v.title}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff", fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 40,
  },
  title: { textAlign: "center", fontSize: 18, fontWeight: "bold" },
  chart: { marginVertical: 20, borderRadius: 11, paddingRight: 30 },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  iconButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    width: 100,
    alignItems: "center",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  videoCard: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#f3f3f3",
    padding: 10,
    borderRadius: 10,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#FF8C00",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default ScoialDashboard;

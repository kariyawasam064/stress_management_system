import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { AuthContext } from "../context/AuthContext";
import Node from "../api/node/Node";

const MonthlyBalanceChart = ({ email }) => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const { userDetails } = useContext(AuthContext);

  useEffect(() => {
    const fetchYearlyBalance = async () => {
      try {
        const response = await Node.get(
          `/transaction/monthly-balance/${userDetails.RegisterdUser.email}`
        );
        const data = response.data.monthlyBalance;

        const labels = data.map((item) => item.month);
        const values = data.map((item) => item.balance);

        setChartData({ labels, datasets: [{ data: values }] });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching yearly balance:", error);
        setLoading(false);
      }
    };

    fetchYearlyBalance();
  }, [email]);

  if (loading || !chartData) {
    return (
      <View style={[styles.loader, { height: 250 }]}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  const chartWidth = Dimensions.get("window").width - 40;
  const chartHeight = 220;

  const maxValue = Math.max(...chartData.datasets[0].data);

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={chartWidth}
        height={chartHeight}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(34, 128, 176, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: { r: "6", strokeWidth: "2", stroke: "#FF8C00" },
        }}
        bezier
        style={styles.chart}
      />

      {/* Overlay data labels */}
      <View
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          width: chartWidth,
          height: chartHeight,
        }}
        pointerEvents="none"
      >
        {chartData.datasets[0].data.map((value, index) => {
          const x =
            (index / (chartData.datasets[0].data.length - 1)) * chartWidth;
          const y = ((maxValue - value) / maxValue) * (chartHeight - 40); // approximate

          return (
            <Text
              key={index}
              style={{
                position: "absolute",
                left: x - 12,
                top: y,
                fontSize: 12,
                fontWeight: "bold",
                color: "#FF8C00",
                backgroundColor: "rgba(255,255,255,0.8)",
                paddingHorizontal: 4,
                borderRadius: 4,
              }}
            >
              {value}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

export default MonthlyBalanceChart;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    marginVertical: 20,
    alignItems: "center",
  },
  loader: { justifyContent: "center", alignItems: "center" },
  chart: { borderRadius: 16 },
});

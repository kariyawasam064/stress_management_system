import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./src/pages/Home";
import Login from "./src/landing/Login";
import Signup from "./src/landing/Signup";
import AcademicsDashboard from "./src/academics_stress/AcademicDashboard";
import LectureInfo from "./src/academics_stress/LectureInfo";
import { AuthContext } from "./src/context/AuthContext";
import StudyTimeTable from "./src/academics_stress/StudyTimeTable";
import FinancialDashboard from "./src/financial_stress/FinancialDashboard";
import SavingPlan from "./src/financial_stress/SavingPlan";
import ExpensesSection from "./src/financial_stress/ExpensesSection";
import ScoialDashboard from "./src/social_stress/SocialDashboard";
import FriendDashboard from "./src/social_stress/FriendsDashboard";
import MLGenaratedTimeTable from "./src/academics_stress/MLGenaratedTimetable";
import PredictStress from "./src/social_stress/PredictStress";
import SocailNotification from "./src/social_stress/SocailNotification";
import FinanceNotification from "./src/financial_stress/FinanceNotification";
import IncomeSection from "./src/financial_stress/IncomeSection";
import Reminder from "./src/financial_stress/Reminder";


const Stack = createNativeStackNavigator();

export default function AppNav() {
    const { isLoading, userToken } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size={"large"} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken == null ? (
                    <>
                        <Stack.Screen name="Login" component={Login} />
                        <Stack.Screen name="Signup" component={Signup} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Home" component={Home} />
                        <Stack.Screen name="AcademicDashboard" component={AcademicsDashboard} />
                        <Stack.Screen name="LectureInfo" component={LectureInfo} />
                        <Stack.Screen name="StudyTimeTable" component={StudyTimeTable} />
                        <Stack.Screen name="SocialDashboard" component={ScoialDashboard} />
                        <Stack.Screen name="FriendDashboard" component={FriendDashboard} />
                        <Stack.Screen name="MLGeneratedTimetable" component={MLGenaratedTimeTable} />
                        <Stack.Screen name="PredictStress" component={PredictStress} />
                        <Stack.Screen name="SocailNotification" component={SocailNotification} />
                        {/* Add other screens here */}
                        
                        {/* Financial Stress */}
                        <Stack.Screen name="FinancialDashboard" component={FinancialDashboard}/>
                        <Stack.Screen name="SavingPlan" component={SavingPlan}/>
                        <Stack.Screen name="ExpensesSection" component={ExpensesSection} />
                        <Stack.Screen name="FinanceNotification" component={FinanceNotification} />
                        <Stack.Screen name="IncomeSection" component={IncomeSection} />
                        <Stack.Screen name="Reminder" component={Reminder} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>

    );
}

const styles = StyleSheet.create({});

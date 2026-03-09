import {
    StyleSheet,
    Text,
    View,
    Image,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import Header from "../pages/Header";
import Footer from "../pages/Footer";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker"; // 👈 Import Picker
import Node from "../api/node/Node";
import * as DocumentPicker from 'expo-document-picker';
import axios from "axios";
import * as FileSystem from "expo-file-system";


const LectureInfo = (props) => {
    const { UserLogOut, userDetails } = useContext(AuthContext);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        lecturer: "",
        priority: "1",
        description: "",
        user_email: userDetails.RegisterdUser.email,
        module: [{ title: "", link: "", status: "" }], // ✅ initialize as an array
    });
    const [myLectures, setMyLectures] = useState(['']);
    const [expandedLecture, setExpandedLecture] = useState(null); // track expanded lecture

    useEffect(() => {
        Node.get(`/lecture/get/${userDetails.RegisterdUser.email}`).then((res) => {
            console.log(res.data)
            setMyLectures(res.data || []);
        }).catch((err) => {
            console.log(err)
        })
    }, [])


    const handleSubmit = () => {
        console.log("Form Data:", formData);
        Node.post('/lecture/add', formData).then((res) => {
            console.log('done')
        }).catch((err) => {
            console.log(err)
        })
        setModalVisible(false);
        setFormData({ title: "", description: "", lecturer: "", priority: "3" });
    };

    const handleModuleChange = (index, key, value) => {
        const updatedModules = [...formData.module];
        updatedModules[index][key] = value;
        setFormData({ ...formData, module: updatedModules });
    };

    const addNewModule = () => {
        setFormData({
            ...formData,
            module: [...formData.module, { title: "", link: "", status: "" }],
        });
    };


    const sendToBackend = async (data) => {
        console.log('came 1 ', data)

        try {

            await axios.post("http://192.168.1.45:5000/lecture/bulk", {
                lectures: data
            });

            alert("Lectures imported successfully");

        } catch (err) {
            console.log(err);
        }

    };

    const parseText = (text) => {
        console.log('came 3', text)
        const rows = text.split("\n").filter(r => r.trim() !== "");

        const lectures = {};

        rows.slice(1).forEach(row => {

            const columns = row.split(/\s{2,}/);

            const subject = columns[0];
            const lecturer = columns[1];
            const priority = columns[2];
            const note = columns[3];
            const moduleTitle = columns[4];
            const moduleLink = columns[5];

            if (!lectures[subject]) {
                lectures[subject] = {
                    module_name: subject,
                    lecture_name: lecturer,
                    priority,
                    description: note,
                    user_email: userDetails.RegisterdUser.email,
                    module: []
                };
            }

            lectures[subject].module.push({
                title: moduleTitle,
                link: moduleLink,
                status: "pending"
            });

        });

        sendToBackend(Object.values(lectures));
    };


    const readPDF = async (uri) => {
        console.log('came 2 ', uri)
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64
        });

        parseText(atob(base64));
    };



    // const pickPDF = async () => {
    //     console.log('came 1 ')
    //     const result = await DocumentPicker.getDocumentAsync({
    //         type: "application/pdf"
    //     });

    //     if (result.canceled) return;

    //     const file = result.assets[0];

    //     readPDF(file.uri);
    // };



    const pickPDF = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
        if (result.canceled) return;

        const file = result.assets[0];
        const formData = new FormData();
        formData.append("file", {
            uri: file.uri,
            name: file.name,
            type: "application/pdf",
        });

        // Add user email
        formData.append("user_email", userDetails.RegisterdUser.email);

        try {
            const res = await axios.post("http://192.168.1.45:5003/lecture/upload-pdf", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log(res.data);
            alert("Lectures imported successfully");
        } catch (err) {
            console.error(err);
        }
    };



    return (
        <LinearGradient colors={["#ffffffff", "#ffffffff"]} style={styles.container}>
            <Header />

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.heading}>Resource Management</Text>
                <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingTop: 10, paddingBottom: 20 }}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => setModalVisible(true)}>
                        <FontAwesome name="plus" size={18} color="#FF8C00" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={pickPDF}
                    >
                        <FontAwesome name="upload" size={18} color="#FF8C00" />
                    </TouchableOpacity>
                </View>

                {/* Display lectures */}
                {myLectures.map((lecture, index) => (
                    <View key={lecture._id || index} style={styles.card}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <View>
                                <Text style={styles.cardTitle}>Subject Name - {lecture.module_name}</Text>
                                <Text style={styles.cardSubtitle}>Lecturer Name - {lecture.lecture_name}</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setExpandedLecture(expandedLecture === index ? null : index)}
                            >
                                <FontAwesome
                                    name={expandedLecture === index ? "angle-up" : "angle-down"}
                                    size={22}
                                    color="#333"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Expanded module list */}
                        {expandedLecture === index && lecture.module && lecture.module.length > 0 && (
                            <View style={{ marginTop: 10, paddingLeft: 10 }}>
                                {lecture.module.map((mod, modIndex) => (
                                    <TouchableOpacity
                                        key={modIndex}
                                        onPress={() => Linking.openURL(mod.link)}
                                    >
                                        <Text style={styles.moduleItem}>
                                            🔹Module {modIndex + 1} :  {mod.title}
                                        </Text>
                                        <Text style={{ marginLeft: 20, color: '#454545ff' }}>
                                            Link :  {mod.link}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Modal Popup Form */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Scrollable area inside modal */}
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={{ flex: 1 }}
                        >
                            <ScrollView
                                contentContainerStyle={{ paddingBottom: 40 }}
                                showsVerticalScrollIndicator={true}
                            >
                                <Text style={styles.modalTitle}>Add New Module</Text>

                                <TextInput
                                    placeholder="Module Name"
                                    style={styles.input}
                                    value={formData.title}
                                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                                />

                                <TextInput
                                    placeholder="Lecturer Name"
                                    style={styles.input}
                                    value={formData.lecturer}
                                    onChangeText={(text) => setFormData({ ...formData, lecturer: text })}
                                />

                                <View style={styles.dropdownContainer}>
                                    <Text style={styles.dropdownLabel}>Priority:</Text>
                                    <View style={styles.pickerWrapper}>
                                        <Picker
                                            selectedValue={formData.priority}
                                            onValueChange={(itemValue) =>
                                                setFormData({ ...formData, priority: itemValue })
                                            }
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="1 (Lowest)" value="1" />
                                            <Picker.Item label="2" value="2" />
                                            <Picker.Item label="3 (Medium)" value="3" />
                                            <Picker.Item label="4" value="4" />
                                            <Picker.Item label="5 (Highest)" value="5" />
                                        </Picker>
                                    </View>
                                </View>

                                <TextInput
                                    placeholder="Enter description"
                                    style={[styles.input, { height: 100 }]}
                                    multiline
                                    value={formData.description}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, description: text })
                                    }
                                />

                                <Text style={styles.sectionTitle}>Modules</Text>

                                {/* {formData.module.map((mod, index) => (
                                    <View key={index} style={styles.moduleContainer}>
                                        <TextInput
                                            placeholder={`Module ${index + 1} Title`}
                                            style={styles.input}
                                            value={mod.title}
                                            onChangeText={(text) =>
                                                handleModuleChange(index, "title", text)
                                            }
                                        />

                                        <TextInput
                                            placeholder={`Module ${index + 1} link`}
                                            style={styles.input}
                                            value={mod.link}
                                            onChangeText={(text) =>
                                                handleModuleChange(index, "link", text)
                                            }
                                        />
                                    </View>
                                ))} */}
                                {Array.isArray(formData.module) &&
                                    formData.module.map((mod, index) => (
                                        <View key={index} style={styles.moduleContainer}>
                                            <TextInput
                                                placeholder={`Module ${index + 1} Title`}
                                                style={styles.input}
                                                value={mod.title}
                                                onChangeText={(text) => handleModuleChange(index, "title", text)}
                                            />

                                            <TextInput
                                                placeholder={`Module ${index + 1} Link`}
                                                style={styles.input}
                                                value={mod.link}
                                                onChangeText={(text) => handleModuleChange(index, "link", text)}
                                            />
                                        </View>
                                    ))}


                                <TouchableOpacity
                                    style={[styles.addButton, { backgroundColor: "#f1bc7cff" }]}
                                    onPress={addNewModule}
                                >
                                    <Text style={styles.addButtonText}>+ Add Another Module</Text>
                                </TouchableOpacity>

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: "#FF8C00" }]}
                                        onPress={handleSubmit}
                                    >
                                        <Text style={styles.buttonText}>Submit</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: "#999" }]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>

            <Footer />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 30,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    heading: {
        textAlign: "center",
        fontSize: 28,
        fontWeight: "bold",
        color: "#FF8C00",
        marginBottom: 10,
        textShadowColor: "rgba(0, 0, 0, 0.2)",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        paddingTop: 10
    },
    description: {
        textAlign: "center",
        fontSize: 16,
        color: "#000000ff",
        marginVertical: 15,
        lineHeight: 22,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        padding: 10,
        borderRadius: 8,
    },
    image: {
        width: "100%",
        height: 200,
        resizeMode: "cover",
        borderRadius: 10,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: "#004d40",
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FF8C00",
        marginVertical: 15,
    },
    featureCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fcc47eff",
        padding: 12,
        borderRadius: 10,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    featureIcon: {
        fontSize: 28,
        marginRight: 10,
        color: "#00796b",
    },
    featureText: {
        fontSize: 16,
        color: "white",
        flex: 1,
        lineHeight: 22,
    },
    boldText: {
        fontWeight: "bold",
        color: "white",
    },
    finalNote: {
        textAlign: "center",
        fontSize: 16,
        color: "#FF8C00",
        marginTop: 20,
        lineHeight: 24,
        fontStyle: "italic",
        padding: 15,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FF8C00",
    },
    // buttonRow: {
    //     flexDirection: "row",
    //     justifyContent: "space-around",
    //     alignItems: "center",
    //     marginTop: 20,
    //     paddingVertical: 10,
    // },

    iconButton: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 10,
        width: 60,
        elevation: 3, // adds shadow on Android
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 1, height: 2 },
        shadowRadius: 4,
    },

    buttonLabel: {
        marginTop: 1,
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalContainer: {
        backgroundColor: "white",
        width: "85%",
        borderRadius: 10,
        padding: 20,
        height: "80%"
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FF8C00",
        marginBottom: 15,
        textAlign: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    modalButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
    dropdownContainer: {
        marginBottom: 15,
    },
    dropdownLabel: {
        fontWeight: "600",
        color: "#c0c0c0ff",
        marginBottom: 5,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        overflow: "hidden",
    },
    picker: {
        height: 150,
    },
    // sectionTitle: {
    //     fontSize: 18,
    //     fontWeight: "bold",
    //     marginTop: 20,
    //     marginBottom: 10,
    // },
    moduleContainer: {
        marginBottom: 10,
    },
    addButton: {
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginVertical: 10,
        marginHorizontal: 5
    },
    addButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    contentContainer: {
        padding: 16,
        backgroundColor: "#fff",
    },
    // heading: {
    //     fontSize: 22,
    //     fontWeight: "bold",
    //     marginBottom: 10,
    // },
    card: {
        backgroundColor: "#f9f9f9",
        padding: 12,
        marginBottom: 10,
        borderRadius: 10,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
    },
    cardSubtitle: {
        fontSize: 14,
        color: "#555",
    },
    moduleItem: {
        fontSize: 14,
        color: "#007AFF",
        marginBottom: 5,
    },
});

export default LectureInfo;

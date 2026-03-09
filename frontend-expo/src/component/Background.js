import { ImageBackground, View } from 'react-native'
import React from 'react'

export default function Background({ children }) {
    return (
        <View style={{marginTop:30}}>
            {/* <ImageBackground source={require("./assets/landing_bg.jpg")} style={{ height: '100%', width:'100%' }} /> */}
            <View style={{ position: 'absolute' }}>
                {children}
            </View>
        </View>
    )
}

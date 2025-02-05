import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    popupContainerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1,
    },
    popupContainer: {
        maxHeight: 700,
        width: "90%",
        margin: "auto",
        backgroundColor: "#0c101c",
        borderRadius: 15,
        padding: 10,
    },
    fileHeader: {
        fontSize: 22,
        fontWeight: "bold",
        color: "white",
        marginBottom: 10,
    },
    fileInfoContainer: {
        flexDirection: "row",
        marginHorizontal: 10,
        marginVertical: 10,
        alignItems: "center",
    },
    fileInfoTextContainer: {
        marginLeft: 10
    },
    fileInfoHeader: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
    fileInfoText: {
        fontSize: 14,
        color: "gray",
        wordWrap: "break-word",
    },
    selectRenderItemText: {
        fontSize: 18,
        fontWeight: "bold",
        padding: 4,
        borderRadius: 10,
        alignSelf: 'flex-start'
    },
    selectRenderItemContainer: {
        flex: 1,
    },
    selectRenderSelectedItemText: {
        flex: 1,
        textAlignVertical: "center",
        fontSize: 15,
        padding: 4,
        borderRadius: 10,
    },
    removeFolderButton: {
        backgroundColor: "#e03131",
        padding: 10,
        marginTop: 4,
        borderRadius: 6,
        justifyContent: "center"
    },
    removeFolderButtonText: {
        textAlign: "center",
        fontWeight: "bold",
        color: "white",
    },
    subHeaderText: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: "bold",
        color: "gray",
    },
    actionButtonsContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
        marginTop: 10,
        marginHorizontal: -5
    },
    actionButton: {
        width: 30,
        height: 30,
        borderRadius: 10,
        padding: 5,
        backgroundColor: "#343a40",
        alignItems: "center",
        marginHorizontal: 5
    },
    actionButtonEdit: {
        backgroundColor: "#e8590c"
    },
    actionButtonFavorite: {
        backgroundColor: "#f08c00"
    },
    actionButtonOpen: {
        backgroundColor: "#323ea8"
    },
    actionButtonDelete: {
        backgroundColor: "#e03131"
    },
    textDisplay: {
        borderRadius: 15,
        padding: 15,
        height: 220,
        fontFamily: "monospace",
        textAlignVertical: "top",
    },
    popupContent: {
        height: "auto",
        width: "100%"
    },
    mainHeaderText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "white",
    },
    serverActionWarningText: {
        marginTop: 10,
        color: "white"
    },
    fileDeleteButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    fileDeleteButtonDanger: {
        backgroundColor: "#CF4238"
    },
    fileDeleteButtonCancel: {
        backgroundColor: "#181c28"
    },
    button: {
        backgroundColor: "#323ea8",
        padding: 10,
        marginTop: 10,
        borderRadius: 6,
        justifyContent: "center"
    },
    buttonDanger: {
        backgroundColor: "#CF4238"
    },
    buttonText: {
        textAlign: "center",
        fontWeight: "bold",
        color: "white",
    },
    popupSubHeaderText: {
        marginTop: 10,
        marginLeft: 10,
		fontSize: 13,
		fontWeight: "bold",
		color: "gray",
    },
    popupHeaderText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
    popupHeaderTextDanger: {
        color: "#CF4238"
    },
    textInput: {
		width: "100%",
		borderWidth: 2,
		borderColor: "#222c47",
		margin: "auto",
		color: "white",
		height: 40,
		paddingHorizontal: 10,
		fontSize: 15,
		borderRadius: 6,
		marginTop: 5,
	},
})
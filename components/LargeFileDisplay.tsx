import { styles } from "@/styles/components/largeFileDisplay";
import type { APIFile, APIFoldersNoIncl, APITags, DashURL } from "@/types/zipline";
import { type ColorValue, Pressable, Text, ToastAndroid, View } from "react-native";
import FileDisplay from "@/components/FileDisplay";
import * as db from "@/functions/database";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { MaterialIcons } from "@expo/vector-icons";
import Select from "./Select";
import { convertToBytes } from "@/functions/util";
import { useEffect, useState } from "react";
import { getTags } from "@/functions/zipline/tags";
import { isLightColor } from "@/functions/color";
import { addFileToFolder, getFolders, removeFileFromFolder } from "@/functions/zipline/folders";
import axios from "axios";
import { deleteFile, editFile, type EditFileOptions } from "@/functions/zipline/files";
import { type ExternalPathString, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system"
import Popup from "@/components/Popup";
import React from "react";
import TextInput from "./TextInput";

interface Props {
	file: APIFile;
	hidden: boolean;
	onClose: (refresh?: boolean) => void | Promise<void>;
}

// WIP
export default function LargeFileDisplay({ file, hidden, onClose }: Props) {
	const router = useRouter()

	const dashUrl = db.get("url") as DashURL | null;

	const [tags, setTags] = useState<APITags>([]);
	const [folders, setFolders] = useState<APIFoldersNoIncl>([]);

	const [fileContent, setFileContent] = useState<string | null>(null)

	const [filePassword, setFilePassword] = useState<boolean>(file.password)
	const [fileMaxViews, setFileMaxViews] = useState<number | null>(file.maxViews)
	const [fileOriginalName, setFileOriginalName] = useState<string | null>(file.originalName)
	const [fileType, setFileType] = useState<string>(file.type)
	const [fileFolderId, setFileFolderId] = useState<string | null>(file.folderId)
	const [fileFavorite, setFileFavorite] = useState<boolean>(file.favorite)
	
	const [tempHidden, setTempHidden] = useState<boolean>(false)

	const [deleteFilePopup, setDeleteFilePopup] = useState<boolean>(false)
	const [editFilePopup, setEditFilePopup] = useState<boolean>(false)

	const [editFileMaxViews, setEditFileMaxViews] = useState<number | null>(file.maxViews);
	const [editFileOriginalName, setEditFileOriginalName] = useState<string | null>(file.originalName);
	const [editFileType, setEditFileType] = useState<string>(file.type);
	const [editFilePassword, setEditFilePassword] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			const tags = await getTags()
			const folders = await getFolders(true)

			setTags(typeof tags === "string" ? [] : tags)
			setFolders(typeof folders === "string" ? [] : folders)
		})()
	}, [])

	useEffect(() => {
		if (fileType.startsWith("text/")) {
			(async () => {
				const res =	await axios.get(`${dashUrl}/raw/${file.name}`, {
					responseType: "text"
				})

				setFileContent(res.data as string)
			})()
		}

		setDeleteFilePopup(false)
		setTempHidden(false)
	}, [file, dashUrl, fileType])

	return (
		<>
			<Popup hidden={!deleteFilePopup} onClose={() => {
				setDeleteFilePopup(false)
				setTempHidden(false)
			}}>
				<View style={styles.popupContent}>
					<Text style={styles.mainHeaderText}>Are you sure?</Text>

					<Text style={styles.serverActionWarningText}>Are you sure you want to delete {file.name}? This action cannot be undone.</Text>

					<View style={styles.fileDeleteButtonsContainer}>
						<Pressable style={{
							...styles.button,
							...styles.fileDeleteButtonCancel,
							marginRight: 10
						}} onPress={() => {
							setDeleteFilePopup(false)
							setTempHidden(false)
						}}>
							<Text style={styles.buttonText}>Cancel</Text>
						</Pressable>

						<Pressable style={{
							...styles.button,
							...styles.fileDeleteButtonDanger,
							marginRight: 10
						}} onPress={async () => {
							const fileId = file.id

							const success = await deleteFile(fileId)

							if (typeof success === "string") {
								ToastAndroid.show(
									`Error: ${success}`,
									ToastAndroid.SHORT
								)

								setDeleteFilePopup(false)
								setTempHidden(false)

								return;
							}

							setDeleteFilePopup(false)
							setTempHidden(false)
							onClose(true)

							ToastAndroid.show(
								`Successfully deleted the file ${file.name}`,
								ToastAndroid.SHORT
							)
						}}>
							<Text style={styles.buttonText}>Delete {file.name}</Text>
						</Pressable>
					</View>
				</View>

				<Text
					style={styles.popupSubHeaderText}
				>
					Press outside to close this popup
				</Text>
			</Popup>

			<Popup hidden={!editFilePopup} onClose={() => {
				setEditFilePopup(false)
				setTempHidden(false)
			}}>
				<View style={styles.popupContent}>
					<Text style={styles.mainHeaderText}>Editing "{file.name}"</Text>

					<TextInput
						title="Max Views:"
						onValueChange={(content) => {
							setEditFileMaxViews(Math.abs(Number.parseInt(content)));
						}}
						value={editFileMaxViews ? String(editFileMaxViews) : ""}
						keyboardType="numeric"
						placeholder="Unlimited"
					/>

					<TextInput
						title="Original Name:"
						onValueChange={(content) => {
							setEditFileOriginalName(content);
						}}
						value={editFileOriginalName || ""}
					/>

					<TextInput
						title="Type:"
						onValueChange={(content) => {
							setEditFileType(content);
						}}
						value={editFileType || ""}
					/>

					{filePassword ? (
						<Pressable style={{
							...styles.button,
							...styles.buttonDanger
						}} onPress={() => {
							const fileId = file.id

							const success = editFile(fileId, {
								password: null
							})

							if (typeof success === "string") return ToastAndroid.show(
								`Error: ${success}`,
								ToastAndroid.SHORT
							)

							setFilePassword(false)
							file.password = false

							ToastAndroid.show(
								"Successfully removed the password",
								ToastAndroid.SHORT
							)
						}}>
							<Text style={styles.buttonText}>Remove Password</Text>
						</Pressable>
					) : (
						<TextInput
							title="Password:"
							password
							onValueChange={(content) => {
								setEditFilePassword(content);
							}}
							value={editFilePassword || ""}
						/>
					)}

					<Pressable
						style={styles.button}
						onPress={async () => {
							const fileId = file.id

							const editData: EditFileOptions = {}

							editData.maxViews = editFileMaxViews || null
							editData.type = editFileType
							if (editFileOriginalName) editData.originalName = editFileOriginalName
							if (editFilePassword) editData.password = editFilePassword

							const success = await editFile(fileId, editData)

							if (typeof success === "string") return ToastAndroid.show(
								`Error: ${success}`,
								ToastAndroid.SHORT
							)
							
							if (editFilePassword) {
								setFilePassword(true)
								file.password = true
							}

							file.originalName = editFileOriginalName || null
							setFileOriginalName(editFileOriginalName || null)

							file.type = editFileType
							setFileType(editFileType)

							file.maxViews = editFileMaxViews || null
							setFileMaxViews(editFileMaxViews)

							setEditFilePopup(false)
							setTempHidden(false)

							ToastAndroid.show(
								`Successfully edited the file ${file.name}`,
								ToastAndroid.SHORT
							)
						}}	
					>
						<Text style={styles.buttonText}>Save Changes</Text>
					</Pressable>
				</View>
			</Popup>

			<Pressable
				style={{
					...styles.popupContainerOverlay,
					...((hidden || tempHidden || !file) && { display: "none" }),
				}}
				onPress={(e) => {
					if (e.target === e.currentTarget) onClose();
				}}
			>
				<View style={styles.popupContainer}>
					<Text style={styles.fileHeader}>{file.name}</Text>

					<KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
						{fileContent ? (
							<TextInput
								multiline
								showDisabledStyle={false}
								disabled
								inputStyle={styles.textDisplay}
								value={fileContent}
							/>
						) : (
							<FileDisplay
								passwordProtected={!!filePassword}
								uri={`${dashUrl}/raw/${file.name}`}
								originalName={fileOriginalName}
								mimetype={fileType}
								name={file.name}
								maxHeight={500}
								width={350}
								file={file}
								autoHeight
							/>
						)}

						<View style={styles.fileInfoContainer}>
							<MaterialIcons name="description" size={28} color="white" />
							<View style={styles.fileInfoTextContainer}>
								<Text style={styles.fileInfoHeader}>Type</Text>
								<Text style={styles.fileInfoText}>{file.type}</Text>
							</View>
						</View>

						<View style={styles.fileInfoContainer}>
							<MaterialIcons name="sd-storage" size={28} color="white" />
							<View style={styles.fileInfoTextContainer}>
								<Text style={styles.fileInfoHeader}>Size</Text>
								<Text style={styles.fileInfoText}>{convertToBytes(file.size, {
									unitSeparator: " "
								})}</Text>
							</View>
						</View>

						<View style={styles.fileInfoContainer}>
							<MaterialIcons name="visibility" size={28} color="white" />
							<View style={styles.fileInfoTextContainer}>
								<Text style={styles.fileInfoHeader}>View</Text>
								<Text style={styles.fileInfoText}>{file.views}{(fileMaxViews && !Number.isNaN(fileMaxViews)) && `/${fileMaxViews}`}</Text>
							</View>
						</View>

						<View style={styles.fileInfoContainer}>
							<MaterialIcons name="file-upload" size={28} color="white" />
							<View style={styles.fileInfoTextContainer}>
								<Text style={styles.fileInfoHeader}>Created At</Text>
								<Text style={styles.fileInfoText}>{new Date(file.createdAt).toLocaleString()}</Text>
							</View>
						</View>

						<View style={styles.fileInfoContainer}>
							<MaterialIcons name="autorenew" size={28} color="white" />
							<View style={styles.fileInfoTextContainer}>
								<Text style={styles.fileInfoHeader}>Updated At</Text>
								<Text style={styles.fileInfoText}>{new Date(file.updatedAt).toLocaleString()}</Text>
							</View>
						</View>

						{file.deletesAt && (
							<View style={styles.fileInfoContainer}>
								<MaterialIcons name="auto-delete" size={28} color="white" />
								<View style={styles.fileInfoTextContainer}>
									<Text style={styles.fileInfoHeader}>Deletes At</Text>
									<Text style={styles.fileInfoText}>{new Date(file.deletesAt).toLocaleString()}</Text>
								</View>
							</View>
						)}

						{fileOriginalName && (
							<View style={styles.fileInfoContainer}>
								<MaterialIcons name="title" size={28} color="white" />
								<View style={styles.fileInfoTextContainer}>
									<Text style={styles.fileInfoHeader}>Original Name</Text>
									<Text style={styles.fileInfoText}>{fileOriginalName}</Text>
								</View>
							</View>
						)}

						<Text style={styles.fileInfoHeader}>Tags</Text>
						<Select
							placeholder="Select Tags..."
							multiple
							disabled={tags.length <= 0}
							data={tags.map(tag => ({
								label: tag.name,
								value: tag.id,
								color: tag.color
							}))}
							onSelect={async (selectedTags) => {
								const newTags = selectedTags.map(tag => tag.value)

								const success = editFile(file.id, {
									tags: newTags
								})

								if (typeof success === "string") return ToastAndroid.show(
									`Error: ${success}`,
									ToastAndroid.SHORT
								)

								file.tags = tags.filter(tag => newTags.includes(tag.id))

								ToastAndroid.show(
									"Successfully updated the tags",
									ToastAndroid.SHORT
								)
							}}
							renderItem={(item) => (
								<View style={styles.selectRenderItemContainer}>
									<Text style={{
										...styles.selectRenderItemText,
										color: isLightColor(item.color as string) ? "black" : "white",
										backgroundColor: item.color as ColorValue,
									}}>{item.label}</Text>
								</View>
							)}
							defaultValues={tags.filter(tag => file.tags.find(fileTag => fileTag.id === tag.id)).map(tag => ({
								label: tag.name,
								value: tag.id,
								color: tag.color
							}))}
							renderSelectedItem={(item, key) => (
								<Text key={key} style={{
									...styles.selectRenderSelectedItemText,
									color: isLightColor(item.color as string) ? "black" : "white",
									backgroundColor: item.color as ColorValue,
								}}>{item.label}</Text>
							)}
							maxHeight={500}
						/>

						<Text style={styles.fileInfoHeader}>Folder</Text>
						{fileFolderId ? (
							<Pressable style={styles.removeFolderButton} onPress={async () => {
								if (!fileFolderId) return;

								const folderId = fileFolderId
								const fileId = file.id

								const success = removeFileFromFolder(folderId, fileId)

								if (typeof success === "string") return ToastAndroid.show(
									`Error: ${success}`,
									ToastAndroid.SHORT
								)

								setFileFolderId(null)
								file.folderId = null

								ToastAndroid.show(
									"Successfully removed the file from the folder",
									ToastAndroid.SHORT
								)
							}}>
								<Text style={styles.removeFolderButtonText}>Remove from folder "{folders.find(folder => folder.id === file.folderId)?.name}"</Text>
							</Pressable>
						) : (
							<Select
								placeholder="Add to Folder..."
								data={folders.map(folder => ({
									label: folder.name,
									value: folder.id,
								}))}
								defaultValue={file.folderId ? {
									label: (folders.find(folder => folder.id === file.folderId) as APIFoldersNoIncl[0])?.name,
									value: file.folderId
								} : undefined}
								onSelect={async (selectedFolder) => {
									const folderId = selectedFolder[0].value
									const fileId = file.id

									const success = await addFileToFolder(folderId, fileId)

									if (typeof success === "string") return ToastAndroid.show(
										`Error: ${success}`,
										ToastAndroid.SHORT
									)

									setFileFolderId(folderId)
									file.folderId = folderId

									ToastAndroid.show(
										"Successfully added the file to the folder",
										ToastAndroid.SHORT
									)
								}}
							/>
						)}

						<Text style={styles.subHeaderText}>{file.id}</Text>

						<View style={styles.actionButtonsContainer}>
							<Pressable style={{
								...styles.actionButton,
								...styles.actionButtonEdit
							}} onPress={() => {
								setEditFilePopup(true)
								setTempHidden(true)
							}}>
								<MaterialIcons name="edit" size={20} color="white"  />
							</Pressable>

							<Pressable style={{
								...styles.actionButton,
								...styles.actionButtonDelete
							}} onPress={() => {
								setDeleteFilePopup(true)
								setTempHidden(true)
							}}>
								<MaterialIcons name="delete" size={20} color="white"  />
							</Pressable>

							<Pressable style={{
								...styles.actionButton,
								...(fileFavorite && styles.actionButtonFavorite)
							}} onPress={async () => {
								const success = editFile(file.id, {
									favorite: !file.favorite
								})

								if (typeof success === "string") return ToastAndroid.show(
									`Error: ${success}`,
									ToastAndroid.SHORT
								)

								file.favorite = !fileFavorite
								setFileFavorite((prev) => !prev)

								ToastAndroid.show(
									`Successfully ${fileFavorite ? "removed from" : "added to"} favorites`,
									ToastAndroid.SHORT
								)
							}}>
								<MaterialIcons name={fileFavorite ? "star" : "star-outline"} size={20} color="white"  />
							</Pressable>

							<Pressable style={{
								...styles.actionButton,
								...styles.actionButtonOpen
							}} onPress={() => {
								router.replace(`${dashUrl}${file.url}` as ExternalPathString)
							}}>
								<MaterialIcons name="open-in-new" size={20} color="white"  />
							</Pressable>

							<Pressable style={{
								...styles.actionButton
							}} onPress={async () => {
								const url = `${dashUrl}${file.url}`

								const success = await Clipboard.setStringAsync(url)

								if (!success) return ToastAndroid.show(
									"Failed to copy the URL",
									ToastAndroid.SHORT
								)

								ToastAndroid.show(
									"Copied URL to clipboard",
									ToastAndroid.SHORT
								)
							}}>
								<MaterialIcons name="content-copy" size={20} color="white"  />
							</Pressable>

							<Pressable style={{
								...styles.actionButton
							}} onPress={async () => {
								const downloadUrl = `${dashUrl}/raw/${file.name}?download=true`

								let savedFileDownloadUri = db.get("fileDownloadPath")

								if (!savedFileDownloadUri) {
									const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

									if (!permissions.granted) return ToastAndroid.show(
										"The permission to save the file was not granted",
										ToastAndroid.SHORT
									);

									db.set("fileDownloadPath", permissions.directoryUri)
									savedFileDownloadUri = permissions.directoryUri
								}

								ToastAndroid.show(
									"Downloading...",
									ToastAndroid.SHORT
								)

								const saveUri = await FileSystem.StorageAccessFramework.createFileAsync(savedFileDownloadUri, file.name, file.type)

								const downloadResult = await FileSystem.downloadAsync(downloadUrl, `${FileSystem.cacheDirectory}/${file.name}`)

								if (!downloadResult.uri) return ToastAndroid.show(
									"Something went wrong while downloading the file",
									ToastAndroid.SHORT
								)

								const base64File = await FileSystem.readAsStringAsync(downloadResult.uri, {
									encoding: FileSystem.EncodingType.Base64
								})

								await FileSystem.writeAsStringAsync(saveUri, base64File, {
									encoding: FileSystem.EncodingType.Base64
								})

								ToastAndroid.show(
									"Successfully downloaded the file",
									ToastAndroid.SHORT
								)
							}}>
								<MaterialIcons name="file-download" size={20} color="white"  />
							</Pressable>
						</View>
					</KeyboardAwareScrollView>
				</View>
			</Pressable>
		</>
	);
}

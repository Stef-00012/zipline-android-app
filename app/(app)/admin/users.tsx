import { Pressable, ScrollView, Text, View, ToastAndroid } from "react-native";
import type { APISettings, APIUser, APIUserQuota, APIUsersNoIncl, DashURL } from "@/types/zipline";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { getSettings } from "@/functions/zipline/settings";
import { Row, Table } from "react-native-table-component";
import { getFileDataURI, timeDifference } from "@/functions/util";
import { styles } from "@/styles/admin/users";
import { useEffect, useState } from "react";
import * as db from "@/functions/database";
import { createUser, deleteUser, editUser, type EditUserOptions, getUsers } from "@/functions/zipline/users";
import { Image } from "expo-image";
import Popup from "@/components/Popup";
import Select from "@/components/Select";
import { fileQuotaTypes, userRoles } from "@/constants/users";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useAuth } from "@/hooks/useAuth";
import { useShareIntent } from "@/hooks/useShareIntent";
import { router } from "expo-router";
import TextInput from "@/components/TextInput";

export default function Users() {
	useAuth("ADMIN")
	useShareIntent()

	const [users, setUsers] = useState<APIUsersNoIncl | null>(null);
	const [settings, setSettings] = useState<APISettings | null>(null);

	const [userToEdit, setUserToEdit] = useState<APIUsersNoIncl[0] | null>(null)

	const [editUsername, setEditUsername] = useState<string | null>(null);
	const [editPassword, setEditPassword] = useState<string | null>(null);
	const [editAvatar, setEditAvatar] = useState<string>();
	const [editAvatarName, setEditAvatarName] = useState<string | null>(null)
	const [editRole, setEditRole] = useState<Exclude<APIUser["role"], "SUPERADMIN">>("USER");

	const [editFileQuotaType, setEditFileQuotaType] = useState<APIUserQuota["filesQuota"] | "NONE">("BY_BYTES")
	const [editMaxBytes, setEditMaxBytes] = useState<APIUserQuota["maxBytes"] | null>(null)
	const [editMaxFileCount, setEditMaxFileCount] = useState<APIUserQuota["maxFiles"] | null>(null)
	const [editMaxUrls, setEditMaxUrls] = useState<APIUserQuota["maxUrls"] | null>(null)

	const [editError, setEditError] = useState<string>()

	const [createNewUser, setCreateNewUser] = useState<boolean>(false);

	const [newUserUsername, setNewUserUsername] = useState<string | null>(null);
	const [newUserPassword, setNewUserPassword] = useState<string | null>(null);
	const [newUserAvatar, setNewUserAvatar] = useState<string>();
	const [newUserAvatarName, setNewUserAvatarName] = useState<string | null>(null)
	const [newUserRole, setNewUserRole] = useState<Exclude<APIUser["role"], "SUPERADMIN">>("USER");

	const [newUserError, setNewUserError] = useState<string>()

	const [userToDelete, setUserToDelete] = useState<APIUsersNoIncl[0] | null>(null)
	const [userToDeleteData, setUserToDeleteData] = useState<APIUsersNoIncl[0] | null>(null)

	const dashUrl = db.get("url") as DashURL | null;

	useEffect(() => {
		(async () => {
			const users = await getUsers(true);
			const settings = await getSettings();

			setUsers(typeof users === "string" ? null : users);
			setSettings(typeof settings === "string" ? null : settings);
		})();
	}, []);

	useEffect(() => {
		if (userToEdit) {
			setEditUsername(userToEdit.username)
			setEditAvatar(userToEdit.avatar || undefined)
			setEditAvatarName(userToEdit.avatar ? "avatar.png" : null)
			setEditRole(userToEdit.role as Exclude<APIUser["role"], "SUPERADMIN">)
			
			if (userToEdit.quota) {
				setEditFileQuotaType(userToEdit.quota.filesQuota)
				setEditMaxBytes(userToEdit.quota.maxBytes)
				setEditMaxFileCount(userToEdit.quota.maxFiles)
				setEditMaxUrls(userToEdit.quota.maxUrls)
			} else {
				setEditFileQuotaType("NONE")
				setEditMaxBytes(null)
				setEditMaxFileCount(null)
				setEditMaxUrls(null)
			}
		}
	}, [userToEdit])

	return (
		<View style={styles.mainContainer}>
			<View style={styles.mainContainer}>
				<Popup hidden={!userToEdit} onClose={() => {
					setUserToEdit(null)

					setEditUsername(null)
					setEditAvatar(undefined)
					setEditAvatarName(null)
					setEditRole("USER")
					
					setEditFileQuotaType("NONE")
					setEditMaxBytes(null)
					setEditMaxFileCount(null)
					setEditMaxUrls(null)
				}}>
					{userToEdit && (
						<View style={styles.popupContent}>
							<Text style={styles.mainHeaderText}>Edit {userToEdit.username}</Text>
							{editError && <Text style={styles.errorText}>{editError}</Text>}
			
							<KeyboardAwareScrollView
								keyboardShouldPersistTaps="always"
								showsVerticalScrollIndicator={false}
								style={styles.editUserScrollView}
							>
								<TextInput
									title="Username:"
									onValueChange={(content) => {
										setEditUsername((content) || null);
									}}
									value={editUsername || ""}
									placeholder="myUser"
								/>
				
								<TextInput
									title="Password:"
									onValueChange={(content) => {
										setEditPassword(content || null);
									}}
									value={editPassword || ""}
									password
									placeholder="google"
								/>
				
								<Text style={styles.popupHeaderText}>Avatar:</Text>
								<Pressable style={styles.inputButton} onPress={async () => {
									const output = await DocumentPicker.getDocumentAsync({
										type: [
											"image/png",
											"image/jpeg",
											"image/jpg"
										],
										copyToCacheDirectory: true,
									});
				
									if (output.canceled || !output.assets) {
										setEditAvatar(undefined)
										setEditAvatarName(null)
				
										return;
									};
				
									const fileURI = output.assets[0].uri
				
									const fileInfo = await FileSystem.getInfoAsync(fileURI)
				
									if (!fileInfo.exists) return;
				
									const avatarDataURI = await getFileDataURI(fileURI)
				
									setEditAvatar(avatarDataURI || undefined)
									
									const filename = fileURI.split('/').pop() || "avatar.png"
				
									setEditAvatarName(filename)
								}}>
									<Text style={styles.inputButtonText}>{editAvatar ? editAvatarName : "Select an Avatar..."}</Text>
								</Pressable>
				
								<Text style={styles.popupHeaderText}>Role:</Text>
								<Select
									data={userRoles}
									onSelect={(selectedRole) => setEditRole(selectedRole[0].value as Exclude<APIUser["role"], "SUPERADMIN">)}
									placeholder="Select Role..."
									defaultValue={userRoles.find(userRole => userRole.value === editRole)}
								/>
				
								<Text style={styles.mainHeaderText}>Quota</Text>
				
								<Text style={styles.popupHeaderText}>File Quota Type:</Text>
								<Select
									data={fileQuotaTypes}
									onSelect={(selectedQuota) => {
										if (selectedQuota[0].value === "NONE") {
											setEditMaxBytes(null)
											setEditMaxFileCount(null)
											setEditFileQuotaType(selectedQuota[0].value as typeof editFileQuotaType)
										}
				
										setEditFileQuotaType(selectedQuota[0].value as APIUserQuota["filesQuota"])
									}}
									placeholder="Select Quota Type..."
									defaultValue={fileQuotaTypes.find(userQuota => userQuota.value === editFileQuotaType)}
								/>
				
								{["BY_FILES", "BY_BYTES"].includes(editFileQuotaType) && (
									<View>
										{editFileQuotaType === "BY_BYTES" && (
											<View>
												<TextInput
													title="Max Bytes:"
													onValueChange={(content) => {
														setEditMaxBytes((content) || null);
													}}
													value={editMaxBytes || ""}
													placeholder="2gb"
												/>
											</View>
										)}
				
										{editFileQuotaType === "BY_FILES" && (
											<View>
												<TextInput
													title="Max Files:"
													onValueChange={(content) => {
														setEditMaxFileCount(Math.abs(Number.parseInt(content)) || null);
													}}
													value={editMaxFileCount ? String(editMaxFileCount) : ""}
													keyboardType="numeric"
													placeholder="20"
												/>
											</View>
										)}
									</View>
								)}
				
								<TextInput
									title="Max URLs:"
									onValueChange={(content) => {
										setEditMaxUrls(Math.abs(Number.parseInt(content)) || null);
									}}
									value={editMaxUrls ? String(editMaxUrls) : ""}
									placeholder="0"
								/>
							</KeyboardAwareScrollView>
			
							<Pressable
								style={styles.button}
								onPress={async () => {
									setEditError(undefined);
			
									if (!editUsername) return setEditError("Please insert a username");
			
									const userRole = editRole || "USER"

									const editUserOptions: EditUserOptions = {
										role: userRole,
										username: editUsername,
										avatar: editAvatar || undefined,
										password: editPassword || undefined,
										quota: {
											filesType: editFileQuotaType,
											maxBytes: editMaxBytes,
											maxFiles: editMaxFileCount,
											maxUrls: editMaxUrls
										},
									}
			
									const editedUser = await editUser(userToEdit.id, editUserOptions);
			
									if (typeof editedUser === "string")
										return setEditError(editedUser);
			
									ToastAndroid.show(
										`The user "${editedUser.username}" has been updated`,
										ToastAndroid.SHORT
									)

									const updatedUsers = await getUsers(true);

									setUsers(typeof updatedUsers === "string" ? null : updatedUsers);
			
									setEditUsername(null);
									setEditPassword(null);
									setEditAvatar(undefined);
									setEditRole("USER");

									setEditFileQuotaType("BY_BYTES")
									setEditMaxBytes(null)
									setEditMaxFileCount(null)
									setEditMaxUrls(null)

									setUserToEdit(null)
								}}
							>
								<Text style={styles.buttonText}>Update</Text>
							</Pressable>

							<Text
								style={styles.popupSubHeaderText}
							>
								Press outside to close this popup
							</Text>
						</View>
					)}
				</Popup>

				<Popup hidden={!createNewUser} onClose={() => {
					setCreateNewUser(false)

					setNewUserUsername(null)
					setNewUserPassword(null)
					setNewUserAvatar(undefined)
					setNewUserAvatarName(null)
					setNewUserRole("USER")
				}}>
					<View style={styles.popupContent}>
						<Text style={styles.mainHeaderText}>Create User</Text>
						{newUserError && <Text style={styles.errorText}>{newUserError}</Text>}
						
						<TextInput
							title="Username:"
							onValueChange={(content) => {
								setNewUserUsername((content) || null);
							}}
							value={newUserUsername || ""}
							placeholder="myUser"
						/>

						<TextInput
							title="Password:"
							onValueChange={(content) => {
								setNewUserPassword(content || null);
							}}
							value={newUserPassword || ""}
							password
							placeholder="google"
						/>

						<Text style={styles.popupHeaderText}>Avatar:</Text>
						<Pressable style={styles.inputButton} onPress={async () => {
							const output = await DocumentPicker.getDocumentAsync({
								type: [
									"image/png",
									"image/jpeg",
									"image/jpg"
								],
								copyToCacheDirectory: true,
							});

							if (output.canceled || !output.assets) {
								setNewUserAvatar(undefined)
								setNewUserAvatarName(null)

								return;
							};

							const fileURI = output.assets[0].uri

							const fileInfo = await FileSystem.getInfoAsync(fileURI)

							if (!fileInfo.exists) return;

							const avatarDataURI = await getFileDataURI(fileURI)

							setNewUserAvatar(avatarDataURI || undefined)
							
							const filename = fileURI.split('/').pop() || "avatar.png"

							setNewUserAvatarName(filename)
						}}>
							<Text style={styles.inputButtonText}>{newUserAvatar ? newUserAvatarName : "Select an Avatar..."}</Text>
						</Pressable>

						<Text style={styles.popupHeaderText}>Role:</Text>
						<Select
							data={userRoles}
							onSelect={(selectedRole) => setNewUserRole(selectedRole[0].value as Exclude<APIUser["role"], "SUPERADMIN">)}
							placeholder="Select Role..."
							defaultValue={userRoles.find(userRole => userRole.value === newUserRole)}
						/>

						<Pressable
							style={styles.button}
							onPress={async () => {
								setNewUserError(undefined);

								if (!newUserUsername) return setNewUserError("Please insert a username");
								if (!newUserPassword) return setNewUserError("Please insert a password");

								const userRole = newUserRole || "USER"

								const createdUser = await createUser(newUserUsername, newUserPassword, userRole, newUserAvatar);

								if (typeof createdUser === "string")
									return setNewUserError(createdUser);

								ToastAndroid.show(
									`The user ${createdUser.username} has been created`,
									ToastAndroid.SHORT
								)

								setNewUserUsername(null);
								setNewUserPassword(null);
								setNewUserAvatar(undefined);
								setNewUserAvatarName(null);
								setNewUserRole("USER");

								const newUsers = await getUsers(true);

								setUsers(typeof newUsers === "string" ? null : newUsers);

								setCreateNewUser(false)
							}}
						>
							<Text style={styles.buttonText}>Create</Text>
						</Pressable>

						<Text
							style={styles.popupSubHeaderText}
						>
							Press outside to close this popup
						</Text>
					</View>
				</Popup>

				<Popup hidden={!userToDelete} onClose={() => {
					setUserToDelete(null)
				}}>
					<View style={styles.popupContent}>
						{userToDelete && (
							<View>
								<Text style={styles.mainHeaderText}>Delete {userToDelete.username}?</Text>

								<Text style={styles.deleteWarningText}>Are you sure you want to delete {userToDelete.username}? This action cannot be undone.</Text>

								<View style={styles.deleteActionButtonsContainer}>
									<Pressable style={{
										...styles.button,
										...styles.deleteActionButtons,
										...styles.actionButtonCancel,
										marginRight: 10
									}} onPress={() => {
										setUserToDelete(null)
									}}>
										<Text style={styles.buttonText}>Cancel</Text>
									</Pressable>

									<Pressable style={{
										...styles.button,
										...styles.deleteActionButtons,
										...styles.actionButtonDelete
									}} onPress={() => {
										setUserToDeleteData(userToDelete)
										setUserToDelete(null)
									}}>
										<Text style={styles.buttonText}>Delete</Text>
									</Pressable>
								</View>

								<Text
									style={styles.popupSubHeaderText}
								>
									Press outside to close this popup
								</Text>
							</View>
						)}
					</View>
				</Popup>

				<Popup hidden={!userToDeleteData} onClose={() => {
					setUserToDeleteData(null)
				}}>
					<View style={styles.popupContent}>
						{userToDeleteData && (
							<View>
								<Text style={styles.mainHeaderText}>Delete {userToDeleteData.username}'s Data?</Text>

								<Text style={styles.deleteWarningText}>Would you like to delete {userToDeleteData.username}'s files and urls? This action cannot be undone.</Text>

								<Pressable style={{
									...styles.button,
									...styles.actionButtonCancel,
									marginRight: 10
								}} onPress={async () => {
									const userId = userToDeleteData.id

									const deletedUser = await deleteUser(userId, false)

									if (typeof deletedUser === "string") return ToastAndroid.show(
										`Failed to delete the user ${userToDeleteData.username}`,
										ToastAndroid.SHORT
									)

									const newUsers = await getUsers(true);
									
									setUsers(typeof newUsers === "string" ? null : newUsers)

									ToastAndroid.show(
										`Successfully deleted the user ${userToDeleteData.username}`,
										ToastAndroid.SHORT
									)

									setUserToDeleteData(null)
								}}>
									<Text style={styles.buttonText}>No, keep everything & only delete user</Text>
								</Pressable>

								<Pressable style={{
									...styles.button,
									...styles.actionButtonDelete
								}} onPress={async () => {
									const userId = userToDeleteData.id

									const deletedUser = await deleteUser(userId, true)

									if (typeof deletedUser === "string") return ToastAndroid.show(
										`Failed to delete the user "${userToDeleteData.username}"`,
										ToastAndroid.SHORT
									)

									const newUsers = await getUsers(true);
									
									setUsers(typeof newUsers === "string" ? null : newUsers)

									ToastAndroid.show(
										`Successfully deleted the user "${deletedUser.username}" and its data`,
										ToastAndroid.SHORT
									)

									setUserToDeleteData(null)
								}}>
									<Text style={styles.buttonText}>Yes, delete everything</Text>
								</Pressable>

								<Text
									style={styles.popupSubHeaderText}
								>
									Press outside to close this popup
								</Text>
							</View>
						)}
					</View>
				</Popup>

				{users && settings && dashUrl ? (
					<View style={{ flex: 1 }}>
						<View style={styles.header}>
							<Text style={styles.headerText}>Users</Text>
							<View style={styles.headerButtons}>
								<Pressable
									style={styles.headerButton}
									onPress={() => {
										setCreateNewUser(true)
									}}
								>
									<MaterialIcons
										name="person-add"
										size={30}
										color={styles.headerButton.color}
									/>
								</Pressable>
							</View>
						</View>

						<View style={{ ...styles.usersContainer, flex: 1 }}>
							<ScrollView
								showsHorizontalScrollIndicator={false}
								horizontal
							>
								<View>
									<Table>
										<Row
											data={[
												"Avatar",
												"Username",
												"Role",
												"Created",
												"Last Updated",
												"Actions",
											]}
											widthArr={[80, 100, 100, 130, 130, 130]}
											style={styles.tableHeader}
											textStyle={styles.rowText}
										/>
									</Table>
									<ScrollView
										showsVerticalScrollIndicator={false}
										style={styles.tableVerticalScroll}
									>
										<Table>
											{users.map((user, index) => {
                                                const avatar = user.avatar ? (
                                                    <Image
                                                        source={{ uri: user.avatar }}
                                                        style={styles.userAvatar}
                                                        alt={`${user.username}'s avatar`}
                                                    />
                                                ) : (
                                                    <View style={styles.userAvatar}>
                                                        <MaterialIcons
                                                            name="person"
                                                            size={30}
                                                            color={"white"}
                                                        />
                                                    </View>
                                                )
                                                
                                                const username = (
													<Text
														key={user.id}
														style={styles.rowText}
													>
														{user.username}
													</Text>
												);

												const role = (
                                                    <Text
                                                        key={user.id}
                                                        style={styles.rowText}
                                                    >
                                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
                                                    </Text>
												);

												const created = (
													<Text style={styles.rowText}>
														{timeDifference(
															new Date(),
															new Date(user.createdAt),
														)}
													</Text>
												);

                                                const lastUpdated = (
													<Text style={styles.rowText}>
														{timeDifference(
															new Date(),
															new Date(user.updatedAt),
														)}
													</Text>
												);

												const actions = (
													<View style={styles.actionsContainer}>
														<Pressable
															style={styles.actionButton}
															onPress={async () => {
																const userId = user.id

																router.replace(`/files?id=${userId}`)
															}}
														>
															<MaterialIcons
																name="folder-open"
																size={20}
																color={"white"}
															/>
														</Pressable>

														<Pressable
															style={styles.actionButton}
															onPress={() => {
																const userId = user.id;

																setUserToEdit(users.find(usr => usr.id === userId) || null)
															}}
														>
															<MaterialIcons
																name="edit"
																size={20}
																color={"white"}
															/>
														</Pressable>

														<Pressable
															style={{
																...styles.actionButton,
																...styles.actionButtonDanger,
															}}
															onPress={async () => {
																setUserToDelete(user)
															}}
														>
															<MaterialIcons
																name="delete"
																size={20}
																color={"white"}
															/>
														</Pressable>
													</View>
												);

												let rowStyle = styles.row;

												if (index === 0)
													rowStyle = {
														...styles.row,
														...styles.firstRow,
													};

												if (index === users.length - 1)
													rowStyle = {
														...styles.row,
														...styles.lastRow,
													};

												return (
													<Row
														key={user.id}
														data={[
															avatar,
															username,
															role,
															created,
															lastUpdated,
															actions,
														]}
														widthArr={[80, 100, 100, 130, 130, 130]}
														style={rowStyle}
														textStyle={styles.rowText}
													/>
												);
											})}
										</Table>
									</ScrollView>
								</View>
							</ScrollView>
						</View>
					</View>
				) : (
					<View style={styles.loadingContainer}>
						<Text style={styles.loadingText}>Loading...</Text>
					</View>
				)}
			</View>
		</View>
	);
}

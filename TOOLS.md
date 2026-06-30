# TeamViewer MCP — Available Tools (120)

Base URL for all REST calls: `https://webapi.teamviewer.com/api/v1`

## Account
| Tool | Description | REST API |
|---|---|---|
| `tv_get_account` | Returns the account associated with the used API token. | `GET /account` |
| `tv_update_account` | Modifies account settings such as email, name, or password. | `PUT /account` |
| `tv_create_account` | Creates a new TeamViewer account. | `POST /account` |
| `tv_get_tenant_ids` | Retrieves tenant associations for the current account. | `GET /account/TenantIds` |

## Company
| Tool | Description | REST API |
|---|---|---|
| `tv_get_company` | Returns details about the company associated with the API token. | `GET /company` |
| `tv_update_company` | Modifies company information. | `PUT /company` |
| `tv_get_company_license` | Retrieves company licensing data. | `GET /company/license` |

## Contacts
| Tool | Description | REST API |
|---|---|---|
| `tv_list_contacts` | Retrieves the contact listing for the account. | `GET /contacts` |
| `tv_get_contact` | Gets details for a specific contact. | `GET /contacts/{contact_id}` |
| `tv_create_contact` | Adds a new contact by invite. | `POST /contacts` |
| `tv_delete_contact` | Removes a contact. | `DELETE /contacts/{contact_id}` |

## Device Groups
| Tool | Description | REST API |
|---|---|---|
| `tv_list_device_groups` | Returns device groups, optionally filtered by name. | `GET /groups` |
| `tv_create_device_group` | Creates a new device group. | `POST /groups` |
| `tv_get_device_group` | Returns a device group by ID. | `GET /groups/{group_id}` |
| `tv_update_device_group` | Updates a device group. | `PUT /groups/{group_id}` |
| `tv_delete_device_group` | Deletes a device group. | `DELETE /groups/{group_id}` |
| `tv_share_device_group` | Shares a device group with specified users. | `POST /groups/{group_id}/share_group` |
| `tv_unshare_device_group` | Removes group sharing from users. | `POST /groups/{group_id}/unshare_group` |


## Devices
| Tool | Description | REST API |
|---|---|---|
| `tv_list_devices` | Lists all devices with optional filtering by group, online status, or alias. | `GET /devices` |
| `tv_get_device` | Retrieves details of a specific device by ID. | `GET /devices/{device_id}` |
| `tv_create_device` | Creates a new device entry. | `POST /devices` |
| `tv_update_device` | Updates properties of an existing device. | `PUT /devices/{device_id}` |
| `tv_delete_device` | Removes a device from the device list. | `DELETE /devices/{device_id}` |
| `tv_assign_device` | Assigns a device to the current user account. | `POST /devices/assign` |
| `tv_list_iot_sensors` | Lists all IoT sensors associated with a device. | `GET /devices/{device_id}/iot/sensors` |
| `tv_create_iot_sensor` | Creates a new IoT sensor on a device. | `POST /devices/{device_id}/iot/sensors` |
| `tv_get_iot_sensor` | Retrieves configuration for a specific IoT sensor. | `GET /devices/{device_id}/iot/sensors/{sensor_id}` |
| `tv_update_iot_sensor` | Modifies settings of an IoT sensor. | `PUT /devices/{device_id}/iot/sensors/{sensor_id}` |
| `tv_delete_iot_sensor` | Removes an IoT sensor from a device. | `DELETE /devices/{device_id}/iot/sensors/{sensor_id}` |

## Event Logging
| Tool | Description | REST API |
|---|---|---|
| `tv_get_event_logs` | Returns event/audit logs filtered by date range, event types, account emails, or session identifiers. | `POST /EventLogging` |

## Managed Devices
| Tool | Description | REST API |
|---|---|---|
| `tv_list_managed_devices` | Lists all directly managed devices of the manager. | `GET /managed/devices` |
| `tv_list_company_managed_devices` | Lists one page of company-managed devices. | `GET /managed/devices/company` |
| `tv_get_managed_device_assignment_data` | Creates an AssignmentData object for the currently logged-in account (used for onboarding). | `GET /managed/devices/assignment-data` |
| `tv_get_managed_device` | Gets details for a single managed device. | `GET /managed/devices/{device_id}` |
| `tv_update_managed_device` | Changes properties of a managed device (name, policy, group, permission inheritance). | `PUT /managed/devices/{device_id}` |
| `tv_update_managed_device_description` | Changes the description of a managed device. | `PUT /managed/devices/{device_id}/description` |
| `tv_delete_managed_device` | Removes management from a device. | `DELETE /managed/devices/{device_id}` |
| `tv_remove_managed_device_policy` | Removes the assigned policy from a managed device. | `PUT /managed/devices/{device_id}/policy/remove` |
| `tv_get_managed_device_groups` | Lists managed groups a device is part of. | `GET /managed/devices/{device_id}/groups` |
| `tv_update_managed_device_groups` | Edits the groups a managed device belongs to. | `PUT /managed/devices/{device_id}/groups` |
| `tv_list_managed_device_managers` | Lists direct managers of a managed device. | `GET /managed/devices/{device_id}/managers` |
| `tv_add_managed_device_managers` | Adds direct managers to a managed device. | `POST /managed/devices/{device_id}/managers` |
| `tv_remove_managed_device_manager` | Removes a specific manager from a managed device. | `DELETE /managed/devices/{device_id}/managers/{manager_id}` |

## Managed Groups
| Tool | Description | REST API |
|---|---|---|
| `tv_list_managed_groups` | Lists managed device groups with pagination support. | `GET /managed/groups` |
| `tv_get_managed_group` | Retrieves details of a specific managed group. | `GET /managed/groups/{group_id}` |
| `tv_create_managed_group` | Creates a new managed group. | `POST /managed/groups` |
| `tv_update_managed_group` | Modifies properties of a managed group. | `PUT /managed/groups/{group_id}` |
| `tv_delete_managed_group` | Marks a managed group as deleted. | `DELETE /managed/groups/{group_id}` |
| `tv_list_group_managers` | Lists all managers assigned to a managed group. | `GET /managed/groups/{group_id}/managers` |
| `tv_add_group_managers` | Adds managers to a managed group. | `POST /managed/groups/{group_id}/managers` |
| `tv_update_group_managers` | Updates permissions for managers in a managed group. | `PUT /managed/groups/{group_id}/managers` |
| `tv_remove_group_managers` | Removes managers from a managed group. | `DELETE /managed/groups/{group_id}/managers` |

## Monitoring
| Tool | Description | REST API |
|---|---|---|
| `tv_list_monitoring_alarms` | Gets the list of monitoring alarms for the account, with optional filtering. | `GET /monitoring/alarms` |
| `tv_list_monitoring_devices` | Returns devices that have monitoring enabled. | `GET /monitoring/devices` |
| `tv_activate_monitoring` | Activates patch management and monitoring services on a device. | `POST /monitoring/devices` |
| `tv_get_device_hardware_info` | Gets hardware information for a monitored device (CPU, RAM, disk, etc.). | `GET /monitoring/devices/{device_id}/hardware` |
| `tv_get_device_system_info` | Gets system information for a monitored device (OS, hostname, etc.). | `GET /monitoring/devices/{device_id}/information` |
| `tv_get_device_software_info` | Gets installed software data for a monitored device. | `GET /monitoring/devices/{device_id}/software` |

## Policies
| Tool | Description | REST API |
|---|---|---|
| `tv_list_teamviewer_policies` | Returns a list of TeamViewer configuration policies. | `GET /TeamViewerPolicies` |
| `tv_create_teamviewer_policy` | Creates a new TeamViewer configuration policy. | `POST /TeamViewerPolicies` |
| `tv_get_teamviewer_policy` | Gets details of a specific TeamViewer policy. | `GET /TeamViewerPolicies/{policy_id}` |
| `tv_update_teamviewer_policy` | Updates an existing TeamViewer policy. | `PUT /TeamViewerPolicies/{policy_id}` |
| `tv_delete_teamviewer_policy` | Deletes a TeamViewer policy. | `DELETE /TeamViewerPolicies/{policy_id}` |
| `tv_list_monitoring_policies` | Returns the list of monitoring policies. | `GET /Monitoring/Policy` |
| `tv_get_monitoring_policy` | Gets details of a specific monitoring policy. | `GET /Monitoring/Policy/{policy_id}` |
| `tv_assign_monitoring_policy` | Assigns or updates monitoring policies on devices or groups. | `POST /Monitoring/Policy/Assign` |
| `tv_list_patch_management_policies` | Returns the list of patch management policies. | `GET /PatchManagement/Policy` |
| `tv_get_patch_management_policy` | Gets details of a specific patch management policy. | `GET /PatchManagement/Policy/{policy_id}` |
| `tv_assign_patch_management_policy` | Assigns or updates patch management policies on devices or groups. | `POST /PatchManagement/Policy/Assign` |

## Reports
| Tool | Description | REST API |
|---|---|---|
| `tv_list_connection_reports` | Retrieves connection reports. Returns a maximum of 1000 records per call. | `GET /reports/connections` |
| `tv_get_connection_report` | Fetches a specific connection report by ID. | `GET /reports/connections/{connection_id}` |
| `tv_update_connection_report` | Updates metadata (e.g. notes) on a connection report. | `PUT /reports/connections/{connection_id}` |
| `tv_delete_connection_report` | Removes a connection report. | `DELETE /reports/connections/{connection_id}` |
| `tv_get_connection_ai_summary` | Retrieves an AI-generated summary for a session connection. | `GET /reports/connections/{connection_id}/ai-summary` |
| `tv_get_connection_chat_transcript` | Retrieves the chat messaging transcript for a connection. | `GET /reports/connections/{connection_id}/chat-transcript` |
| `tv_get_connection_voice_transcript` | Retrieves the voice call transcript for a connection. | `GET /reports/connections/{connection_id}/voice-transcript` |
| `tv_list_connection_screenshots` | Lists available screenshots for a connection. | `GET /reports/connections/{connection_id}/screenshots` |
| `tv_get_connection_screenshot` | Downloads a specific screenshot from a connection. | `GET /reports/connections/{connection_id}/{screenshot_id}/screenshot` |
| `tv_list_device_reports` | Retrieves device inventory/activity reports. | `GET /reports/devices` |

## Remote Control
| Tool | Description | REST API |
|---|---|---|
| `tv_connect_device` | Opens a TeamViewer remote control session to a device. Launches the TeamViewer desktop app on this machine. | `teamviewerapi://remotecontrol/` (local URL scheme) |

## Sessions
| Tool | Description | REST API |
|---|---|---|
| `tv_list_sessions` | Lists service case sessions with optional filtering. | `GET /sessions` |
| `tv_get_session` | Gets details for a specific service case session. | `GET /sessions/{session_code}` |
| `tv_create_session` | Creates a new service case session. | `POST /sessions` |
| `tv_update_session` | Modifies an existing service case session. | `PUT /sessions/{session_code}` |
| `tv_delete_session` | Closes/terminates a service case session. | `DELETE /sessions/{session_code}` |

## Users
| Tool | Description | REST API |
|---|---|---|
| `tv_list_users` | Returns company users with optional filtering by email, name, or permissions. | `GET /users` |
| `tv_create_user` | Creates a new user in the company. | `POST /users` |
| `tv_get_user` | Returns a specific user by ID. | `GET /users/{user_id}` |
| `tv_update_user` | Updates a user's properties. | `PUT /users/{user_id}` |
| `tv_delete_user` | Deletes a user. | `DELETE /users/{user_id}` |
| `tv_deactivate_user_tfa` | Deactivates two-factor authentication for a user. | `DELETE /users/{user_id}/tfa` |
| `tv_get_user_effective_permissions` | Returns the consolidated permissions from all roles assigned to the current user. | `GET /users/effectivepermissions` |
| `tv_get_user_roles` | Returns the roles assigned to a specific user. | `GET /users/{user_id}/userroles` |
| `tv_respond_to_join_company_request` | Approves or rejects a user's request to join the company. | `POST /users/respondtojointocompanyrequest` |

## User Groups
| Tool | Description | REST API |
|---|---|---|
| `tv_list_user_groups` | Returns all user groups. | `GET /usergroups` |
| `tv_create_user_group` | Creates a new user group. | `POST /usergroups` |
| `tv_get_user_group` | Returns a specific user group. | `GET /usergroups/{group_id}` |
| `tv_update_user_group` | Changes a user group's display name. | `PUT /usergroups/{group_id}` |
| `tv_delete_user_group` | Removes a user group. | `DELETE /usergroups/{group_id}` |
| `tv_list_user_group_members` | Returns members of a user group. | `GET /usergroups/{group_id}/members` |
| `tv_add_user_group_members` | Adds users to a user group. | `POST /usergroups/{group_id}/members` |
| `tv_remove_user_group_members` | Removes users from a user group. | `DELETE /usergroups/{group_id}/members` |
| `tv_remove_user_group_member` | Removes a single user from a user group. | `DELETE /usergroups/{group_id}/members/{account_id}` |
| `tv_get_user_group_role` | Returns the user role assigned to a user group. | `GET /usergroups/{group_id}/userroles` |

## User Roles
| Tool | Description | REST API |
|---|---|---|
| `tv_list_user_roles` | Returns all user roles defined in the company. | `GET /userroles` |
| `tv_create_user_role` | Creates a new user role with specified permissions. | `POST /userroles` |
| `tv_update_user_role` | Updates an existing user role's name or permissions. | `PUT /userroles` |
| `tv_delete_user_role` | Deletes a user role. | `DELETE /userroles?userRoleId={id}` |
| `tv_get_user_role_permissions` | Returns the available permission definitions for user roles. | `GET /userroles/permissions` |
| `tv_get_predefined_user_role` | Returns the predefined (default) user role. | `GET /userroles/predefined` |
| `tv_set_predefined_user_role` | Sets a specific role as the predefined (default) role for new users. | `PUT /userroles/{user_role_id}/predefined` |
| `tv_clear_predefined_user_role` | Clears the predefined user role. | `DELETE /userroles/predefined` |
| `tv_assign_user_role_to_accounts` | Assigns a user role to one or more user accounts. | `POST /userroles/assign/account` |
| `tv_assign_user_role_to_usergroup` | Assigns a user role to a user group. | `POST /userroles/assign/usergroup` |
| `tv_unassign_user_role_from_accounts` | Removes a user role assignment from user accounts. | `POST /userroles/unassign/account` |
| `tv_unassign_user_role_from_usergroup` | Removes a user role assignment from a user group. | `POST /userroles/unassign/usergroup` |
| `tv_get_user_role_account_assignments` | Returns user accounts assigned to a specific user role. | `GET /userroles/assignments/account` |
| `tv_get_user_role_group_assignments` | Returns user groups assigned to a specific user role. | `GET /userroles/assignments/usergroups` |

## OAuth / Tokens
| Tool | Description | REST API |
|---|---|---|
| `tv_oauth_create_permanent_token` | Creates a permanent (non-expiring) access token for the authenticated TeamViewer account. The returned token can be stored as `TEAMVIEWER_API_TOKEN` for use without OAuth. | `POST /OAuth2/accessToken` |
| `tv_oauth_delete_permanent_token` | Deletes the permanent access token associated with the current session. | `DELETE /OAuth2/accessToken` |

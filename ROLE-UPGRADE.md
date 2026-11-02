# Staff roles and uploads

Publish the complete `firestore.rules` in Firebase Console → Firestore Database → Rules, then refresh 0D. The frontend detects the new collections. Until the rules are published it keeps the old upload permissions and message payloads, so regular chat continues working.

| Role | Message deletion | Mute/unmute | Reset PFP and change upload permissions | Staff assignment |
| --- | --- | --- | --- | --- |
| Helper (green) | Lower-ranked users | No | No | No |
| Moderator (orange) | Lower-ranked users | Lower-ranked users | Lower-ranked users | No |
| Admin (blue) | Lower-ranked users | Lower-ranked users | Lower-ranked users | Moderator/Helper |
| Owner (red) | Lower-ranked users | Lower-ranked users | Lower-ranked users | Admin/Moderator/Helper |

Everyone may delete their own messages. Protected historical staff messages remain protected. Announcements, giveaways, pins, title granting and access bans retain their owner/admin permissions.

The existing `admins` and `ownerDevices` collections remain authoritative. `staffRoles/{uid}` contains `role: moderator` or `role: helper`, plus name, addedAt, addedBy. Owners/admins assign these through Home → Mod Control → Staff Roles. Owner role changes clear the other staff collection so demotion does not uncover an old role.

Uploads are allowed by default. `uploadRestrictions/{uid}` optionally stores `pfpBlocked` and/or `mediaBlocked`, plus updatedAt, updatedBy and optional name. The PFP/Image permission forms revoke or restore these separately; subscriptions apply changes immediately. Legacy allowlist documents remain untouched but are no longer needed once the rules are updated. Removing a PFP deletes only imageData, never the entire profile.

Name color and name glow have independent profile-editor switches. Their settings accompany new messages and presence. Profile cards use the person's border color and show their visible staff role badge.

Validation: Firestore emulator tests cover role claims, hierarchy, log/deletion batches, default/revoked/restored upload access, preserving profile data, staff assignments and style types. DOM tests cover action controls, role colors, style switches and visibility of staff panels. No production roles were granted and no production permission restrictions were created during verification.

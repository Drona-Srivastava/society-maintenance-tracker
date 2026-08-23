import { Camera, Check, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { getMediaUrl } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export default function Profile() {
  const { user, updateProfile, uploadProfilePicture } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const cleanPhone = phone.trim();

      if (cleanPhone && !/^\+?\d{10,15}$/.test(cleanPhone)) {
        setError("Enter a valid phone number with 10–15 digits.");
        setSaving(false);
        return;
      }
      const payload = {
        name: name.trim(),
      };

      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      if (address.trim()) {
        payload.address = address.trim();
      }

      await updateProfile(payload);

      setSuccess("Your profile has been updated.");
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.detail || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.");

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");

      event.target.value = "";
      return;
    }

    try {
      setUploadingPhoto(true);
      setError("");
      setSuccess("");
      await uploadProfilePicture(file);

      setSuccess("Your profile picture has been updated.");
      showToast("Profile picture updated successfully.", "success");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail || "Unable to upload your profile picture.",
      );
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="profile-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Account settings</p>

          <h2>Profile</h2>

          <p className="page-description">
            Manage your personal information and profile picture.
          </p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar-wrapper">
              {user?.profile_picture_url ? (
                <img
                  src={getMediaUrl(user.profile_picture_url)}
                  alt={user.name}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar initials">{initials}</div>
              )}

              <button
                type="button"
                className="avatar-camera"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Change profile picture"
              >
                <Camera size={13} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handlePhotoChange}
              />
            </div>

            <h3>{user?.name}</h3>

            <span className="profile-role">
              {user?.role === "admin" ? "Administrator" : "Resident"}
            </span>

            <button
              type="button"
              className="change-photo-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? "Uploading..." : "Change photo"}
            </button>

            <p className="photo-hint">JPG, PNG or WebP · Max 5 MB</p>
          </div>
        </aside>

        <main className="profile-main">
          <form className="profile-form-panel" onSubmit={handleSave}>
            <div className="profile-section-heading">
              <h3>Personal information</h3>

              <p>
                Keep your contact details up to date so the society can reach
                you.
              </p>
            </div>

            <div className="profile-fields">
              <div className="profile-field">
                <label htmlFor="profile-name">Full name</label>

                <div className="profile-input-wrapper">
                  <UserRound size={15} />

                  <input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email address</label>

                <div className="profile-input-wrapper readonly">
                  <Mail size={15} />

                  <input
                    id="profile-email"
                    value={user?.email || ""}
                    readOnly
                  />
                </div>

                <span className="field-hint">
                  Email cannot be changed here.
                </span>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-phone">Phone number</label>

                <div className="profile-input-wrapper">
                  <Phone size={15} />

                  <input
                    id="profile-phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => {
                      const value = event.target.value;

                      // Allow digits and a single + only at the beginning
                      if (/^\+?\d*$/.test(value)) {
                        setPhone(value);
                      }
                    }}
                    placeholder="+91 9876543210"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="profile-field full-width">
                <label htmlFor="profile-address">Address</label>

                <div className="profile-input-wrapper textarea-wrapper">
                  <MapPin size={15} />

                  <textarea
                    id="profile-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Enter your address"
                    rows={4}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {(error || success) && (
              <div
                className={
                  error ? "profile-message error" : "profile-message success"
                }
              >
                {success && <Check size={14} />}

                {error || success}
              </div>
            )}

            <div className="profile-form-footer">
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

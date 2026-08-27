import {
  Camera,
  Check,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { getMediaUrl } from "../../api/client";

export default function AdminProfile() {
  const {
    user,
    updateProfile,
    uploadProfilePicture,
  } = useAuth();

  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(
    user?.address || "",
  );

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const cleanName = name.trim();
      const cleanPhone = phone.trim();
      const cleanAddress = address.trim();

      if (!cleanName) {
        setError("Name cannot be empty.");
        setSaving(false);
        return;
      }

      if (
        cleanPhone &&
        !/^\+?\d{10,15}$/.test(cleanPhone)
      ) {
        setError(
          "Enter a valid phone number with 10–15 digits.",
        );
        setSaving(false);
        return;
      }

      const payload = {
        name: cleanName,
      };

      if (cleanPhone) {
        payload.phone = cleanPhone;
      }

      if (cleanAddress) {
        payload.address = cleanAddress;
      }

      await updateProfile(payload);

      setSuccess("Your profile has been updated.");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a JPEG, PNG, or WebP image.",
      );

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

      setSuccess(
        "Your profile picture has been updated.",
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to upload your profile picture.",
      );
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";

  const profileImage = user?.profile_picture
    ? getMediaUrl(user.profile_picture)
    : null;

  return (
    <div className="admin-profile-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Account settings</p>

          <h2>Profile</h2>

          <p className="page-description">
            Manage your administrator information and
            profile picture.
          </p>
        </div>
      </div>

      <div className="admin-profile-layout">
        <form
          className="admin-profile-form-panel"
          onSubmit={handleSave}
        >
          <div className="admin-profile-section-heading">
            <h3>Personal information</h3>

            <p>
              Update the information associated with
              your administrator account.
            </p>
          </div>

          <div className="admin-profile-fields">
            <div className="admin-profile-field">
              <label htmlFor="admin-profile-name">
                Full name
              </label>

              <div className="admin-profile-input-wrapper">
                <UserRound size={15} />

                <input
                  id="admin-profile-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div className="admin-profile-field">
              <label htmlFor="admin-profile-email">
                Email address
              </label>

              <div className="admin-profile-input-wrapper readonly">
                <Mail size={15} />

                <input
                  id="admin-profile-email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                />
              </div>

              <span className="admin-profile-field-hint">
                Email address cannot be changed.
              </span>
            </div>

            <div className="admin-profile-field">
              <label htmlFor="admin-profile-phone">
                Phone number
              </label>

              <div className="admin-profile-input-wrapper">
                <Phone size={15} />

                <input
                  id="admin-profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="admin-profile-field">
              <label htmlFor="admin-profile-role">
                Role
              </label>

              <div className="admin-profile-input-wrapper readonly">
                <UserRound size={15} />

                <input
                  id="admin-profile-role"
                  type="text"
                  value="Administrator"
                  readOnly
                />
              </div>
            </div>

            <div className="admin-profile-field full-width">
              <label htmlFor="admin-profile-address">
                Address
              </label>

              <div className="admin-profile-input-wrapper admin-textarea-wrapper">
                <MapPin size={15} />

                <textarea
                  id="admin-profile-address"
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="admin-profile-message error">
              {error}
            </div>
          )}

          {success && (
            <div className="admin-profile-message success">
              <Check size={14} />
              {success}
            </div>
          )}

          <div className="admin-profile-form-footer">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
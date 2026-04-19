import { useState } from "react";
import type { UserProfile } from "../types";

type Props = {
  initialValue: UserProfile | null;
  onSave: (profile: UserProfile) => void;
};

export function ProfilePage({ initialValue, onSave }: Props) {
  const baseProfile =
    initialValue ?? {
      name: "",
      ageRange: "20代",
      skinType: "normal",
      sensitivities: [],
      concerns: [],
      currentProductName: "",
      habits: {
        sleepHours: 7,
        stressLevel: 2,
        waterIntakeLevel: 3,
        uvExposureLevel: 2,
      },
      notes: "",
      updatedAt: new Date().toISOString(),
    };

  const [profile, setProfile] = useState<UserProfile>(
    baseProfile,
  );
  const [sensitivitiesInput, setSensitivitiesInput] = useState(baseProfile.sensitivities.join("、"));
  const [concernsInput, setConcernsInput] = useState(baseProfile.concerns.join("、"));

  function updateArray(field: "sensitivities" | "concerns", value: string) {
    if (field === "sensitivities") {
      setSensitivitiesInput(value);
    } else {
      setConcernsInput(value);
    }

    setProfile((current) => ({
      ...current,
      [field]: value
        .split(/[、,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    }));
  }

  return (
    <div className="page-stack">
      <section className="glass-panel">
        <p className="section-kicker">Skin Profile</p>
        <h2>基礎プロフィール登録</h2>
        <p className="lead compact">
          最初に名前を入れてから進みます。そのあとで、ぶれにくい情報と写真ベースの肌状態を登録します。
        </p>

        <div className="form-grid">
          <label className="field">
            <span>呼び名</span>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="未入力でもOK"
            />
          </label>

          <label className="field">
            <span>年代</span>
            <select value={profile.ageRange} onChange={(e) => setProfile({ ...profile, ageRange: e.target.value })}>
              {["10代", "20代", "30代", "40代", "50代+"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>過去に荒れたことのある成分・要素</span>
            <textarea
              value={sensitivitiesInput}
              onChange={(e) => updateArray("sensitivities", e.target.value)}
              placeholder="例: 香料、エタノール、メントール"
            />
          </label>

          <label className="field">
            <span>現在使っているメインの化粧品名</span>
            <input
              value={profile.currentProductName}
              onChange={(e) => setProfile({ ...profile, currentProductName: e.target.value })}
              placeholder="例: メラノCC 化粧水"
            />
          </label>

          <label className="field">
            <span>過去に起きたことのある肌トラブル</span>
            <textarea
              value={concernsInput}
              onChange={(e) => updateArray("concerns", e.target.value)}
              placeholder="例: 赤み、乾燥、ニキビ、ヒリつき"
            />
          </label>

          <label className="field">
            <span>メモ</span>
            <textarea
              value={profile.notes}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
              placeholder="皮膚科で言われたこと、季節で荒れやすい時期など"
            />
          </label>
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={!profile.name.trim()}
          onClick={() => onSave({ ...profile, updatedAt: new Date().toISOString() })}
        >
          名前を保存して次へ
        </button>
      </section>
    </div>
  );
}

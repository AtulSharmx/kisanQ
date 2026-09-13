import React, { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { colors, fontSize, radius } from "../theme";

interface Props {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

/** Large 6-box OTP input, auto-advancing (UI/UX spec section 2). */
export function OtpInput({ length = 6, value, onChange }: Props) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const digits = value.padEnd(length, " ").split("").slice(0, length);

  const setDigit = (index: number, char: string) => {
    const clean = char.replace(/[^0-9]/g, "");
    const next = value.split("");
    next[index] = clean;
    const joined = next.join("").slice(0, length);
    onChange(joined);
    if (clean && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index].trim() && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          value={d.trim()}
          onChangeText={(char) => setDigit(i, char.slice(-1))}
          onKeyPress={(e) => onKeyPress(i, e.nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          style={styles.box}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, justifyContent: "center" },
  box: {
    width: 46,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    textAlign: "center",
    fontSize: fontSize.header,
    fontWeight: "700",
    color: colors.text,
    backgroundColor: colors.surface,
  },
});

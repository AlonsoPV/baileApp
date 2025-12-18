import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  children: React.ReactNode;
  title?: string;
};

type State = {
  error: Error | null;
  info: React.ErrorInfo | null;
};

function getErrorMessage(err: unknown) {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message || String(err);
  return String(err);
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep this as a plain console.error so it shows up in device logs / Xcode logs.
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", info?.componentStack);
    this.setState({ info });
  }

  private onTryAgain = async () => {
    // Try expo-updates reload if available; otherwise just clear the boundary so the user can retry render.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Updates = require("expo-updates");
      if (Updates?.reloadAsync) {
        await Updates.reloadAsync();
        return;
      }
    } catch {
      // ignore
    }

    this.setState({ error: null, info: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const title = this.props.title ?? "Ocurrió un error";
    const message = getErrorMessage(this.state.error);

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          La app encontró un error inesperado. Puedes intentar reiniciar.
        </Text>

        <View style={styles.box}>
          <Text style={styles.mono} numberOfLines={10}>
            {message}
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={this.onTryAgain}>
          <Text style={styles.buttonText}>Reintentar / Reiniciar</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#cfcfcf",
    fontSize: 14,
    marginBottom: 16,
  },
  box: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  mono: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "#f093fb",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
  },
});



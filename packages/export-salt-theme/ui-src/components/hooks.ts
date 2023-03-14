import { useEffect, useCallback, useState } from "react";

export const useFigmaPluginTheme = (
  defaultTheme: "light" | "dark" = "light"
) => {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    // Support Figma dark theme - https://www.figma.com/plugin-docs/css-variables/
    if (document.querySelector("html")?.classList.contains("figma-dark")) {
      setTheme("dark");
    } else {
      setTheme("light");
    }

    setTimeout(() => {
      // When using plugin on LVDI, it's slow to get the correct class name detected
      if (document.querySelector("html")?.classList.contains("figma-dark")) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    }, 100);
  }, []);

  const onMutation = useCallback<MutationCallback>((mutationList) => {
    console.log(
      "onMutation",
      mutationList,
      (mutationList[0].target as any).classList.value
    );
    const theme = (mutationList[0].target as any).classList.contains(
      "figma-dark"
    )
      ? "dark"
      : "light";
    setTheme(theme);
  }, []);
  useMutationObservable(document.querySelector("html")!, onMutation);

  console.log("useFigmaPluginTheme", { theme });

  return [theme, setTheme] as const;
};

const DEFAULT_OPTIONS = {
  config: { attributes: true, childList: false, subtree: false },
};
function useMutationObservable(
  targetEl: Node,
  cb: MutationCallback,
  options = DEFAULT_OPTIONS
) {
  const [observer, setObserver] = useState<MutationObserver | null>(null);

  useEffect(() => {
    const obs = new MutationObserver(cb);
    setObserver(obs);
  }, [cb, options, setObserver]);

  useEffect(() => {
    if (!observer) return;
    const { config } = options;
    observer.observe(targetEl, config);
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [observer, targetEl, options]);
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";

// Mantine styles are imported per component so the bundle only carries the
// components in use.
import "@mantine/core/styles/default-css-variables.css";
import "@mantine/core/styles/baseline.css";
import "@mantine/core/styles/global.css";
import "@mantine/core/styles/UnstyledButton.css";
import "@mantine/core/styles/Accordion.css";
import "@mantine/core/styles/ActionIcon.css";
import "@mantine/core/styles/Alert.css";
import "@mantine/core/styles/Anchor.css";
import "@mantine/core/styles/Badge.css";
import "@mantine/core/styles/Button.css";
import "@mantine/core/styles/Center.css";
import "@mantine/core/styles/CloseButton.css";
import "@mantine/core/styles/Container.css";
import "@mantine/core/styles/Divider.css";
import "@mantine/core/styles/Flex.css";
import "@mantine/core/styles/Grid.css";
import "@mantine/core/styles/Group.css";
import "@mantine/core/styles/Input.css";
import "@mantine/core/styles/InlineInput.css";
import "@mantine/core/styles/Checkbox.css";
import "@mantine/core/styles/Code.css";
import "@mantine/core/styles/Combobox.css";
import "@mantine/core/styles/Loader.css";
import "@mantine/core/styles/Menu.css";
import "@mantine/core/styles/Overlay.css";
import "@mantine/core/styles/ModalBase.css";
import "@mantine/core/styles/Modal.css";
import "@mantine/core/styles/NavLink.css";
import "@mantine/core/styles/NumberInput.css";
import "@mantine/core/styles/Notification.css";
import "@mantine/core/styles/Pagination.css";
import "@mantine/core/styles/Paper.css";
import "@mantine/core/styles/PasswordInput.css";
import "@mantine/core/styles/Pill.css";
import "@mantine/core/styles/Popover.css";
import "@mantine/core/styles/ScrollArea.css";
import "@mantine/core/styles/SegmentedControl.css";
import "@mantine/core/styles/SimpleGrid.css";
import "@mantine/core/styles/Stack.css";
import "@mantine/core/styles/Table.css";
import "@mantine/core/styles/Text.css";
import "@mantine/core/styles/ThemeIcon.css";
import "@mantine/core/styles/Title.css";
import "@mantine/core/styles/Tooltip.css";
import "@mantine/core/styles/VisuallyHidden.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./styles/react.css";

const mountNode = document.getElementById("react-root");

if (mountNode) {
  createRoot(mountNode).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

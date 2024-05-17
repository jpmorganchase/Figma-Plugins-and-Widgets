import {
  Button,
  Menu,
  MenuItem,
  MenuPanel,
  MenuTrigger,
  SplitLayout,
} from "@salt-ds/core";
import { CloseSmallIcon, SettingsIcon, SuccessTickIcon } from "@salt-ds/icons";

import "./SettingMenuButton.css";

export type SettingMenuButtonSetting = { label: string; selected: boolean };

export type SettingMenuButtonProps = {
  settings: SettingMenuButtonSetting[];
  onSettingsChanged: (newSettings: SettingMenuButtonSetting[]) => void;
};

export const SettingMenuButton = ({
  settings,
  onSettingsChanged,
}: SettingMenuButtonProps) => {
  const onMenuClick = (item: string) => {
    const newSettings = settings.map((s) => {
      if (s.label === item) {
        return { ...s, selected: !s.selected };
      } else {
        return s;
      }
    });
    onSettingsChanged(newSettings);
  };
  return (
    <Menu>
      <MenuTrigger>
        <Button variant="primary" aria-label="Open setting menu">
          <SettingsIcon aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuPanel>
        {settings.map((s) => (
          <MenuItem onClick={() => onMenuClick(s.label)}>
            <SplitLayout
              startItem={s.label}
              endItem={s.selected ? <SuccessTickIcon /> : <CloseSmallIcon />}
            />
          </MenuItem>
        ))}
      </MenuPanel>
    </Menu>
  );
};

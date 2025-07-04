import React, { useState } from "react";
import { FlexItem, StackLayout } from "@salt-ds/core";
import { Tab, Tabstrip } from "@salt-ds/lab";
import { SimpleView } from "./SimpleView";
import { AdvancedView } from "./AdvancedView";
import { PLUGIN_RELAUNCH_KEY_REVIEW_REVISION } from "../../shared-src/messages";

declare const __FIGMA_COMMAND__: string;

export const TabsView = () => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(
    __FIGMA_COMMAND__ === PLUGIN_RELAUNCH_KEY_REVIEW_REVISION ? 0 : 1
  );

  const handleTabSelection = (index: number) => {
    setSelectedTabIndex(index);
  };

  const renderView = () => {
    switch (selectedTabIndex) {
      case 0:
        return <SimpleView />;
      case 1:
        return <AdvancedView />;
      default:
        return null;
    }
  };

  return (
    <StackLayout className="appRoot" gap={0}>
      <FlexItem grow={0} shrink={0}>
        <Tabstrip
          activeTabIndex={selectedTabIndex}
          onActiveChange={handleTabSelection}
          className="tab"
        >
          <Tab label="Basic" />
          <Tab label="Key Editable" />
        </Tabstrip>
      </FlexItem>
      {renderView()}
    </StackLayout>
  );
};

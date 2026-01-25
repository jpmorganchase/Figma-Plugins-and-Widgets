import { NodeKeyInput } from "../components/NodeKeyInput";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvents from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SelectableTextNodeInfo } from "../../shared-src/messages";

describe("NodeKeyInput", () => {
  test("call onUpdateNodeKey on blur", async () => {
    const mockNodeInfo = {
      characters: "a",
      checked: false,
      id: "node1:1",
      key: "key",
      name: "Frame 1",
    } satisfies SelectableTextNodeInfo;
    const updateSpy = vi.fn();
    render(
      <NodeKeyInput nodeInfo={mockNodeInfo} onUpdateNodeKey={updateSpy} />
    );
    await userEvents.type(
      screen.getByPlaceholderText(mockNodeInfo.name),
      "abc"
    );
    expect(updateSpy).not.toBeCalled();
    fireEvent.blur(screen.getByPlaceholderText(mockNodeInfo.name));
    expect(updateSpy).toBeCalledWith(mockNodeInfo.id, "keyabc");
  });
});

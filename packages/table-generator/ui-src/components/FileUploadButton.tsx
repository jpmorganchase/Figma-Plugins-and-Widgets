import { Button, ButtonProps, Tooltip, TooltipProps } from "@salt-ds/core";
import React, {
  ChangeEventHandler,
  InputHTMLAttributes,
  SyntheticEvent,
  useId,
  useRef,
} from "react";

export interface FileUploadButtonProps
  extends ButtonProps,
    Pick<InputHTMLAttributes<HTMLInputElement>, "accept"> {
  onFilesChanged?: (files: FileList | null) => void;
  TooltipProps?: Partial<TooltipProps>;
}

export const FileUploadButton = ({
  onClick,
  disabled,
  accept,
  onFilesChanged,
  TooltipProps,
  ...restProps
}: FileUploadButtonProps) => {
  const buttonId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = (event: SyntheticEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    event.stopPropagation();
    onFilesChanged?.(event.target.files);
    if (fileInputRef.current) {
      // make sure selecting the same file would trigger the event next time
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <Tooltip
        content="Upload CSV file for columns"
        placement="top"
        {...TooltipProps}
      >
        <Button
          onClick={handleButtonClick}
          disabled={disabled}
          focusableWhenDisabled
          id={buttonId}
          aria-labelledby={buttonId}
          {...restProps}
        />
      </Tooltip>
      <input
        accept={accept}
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        disabled={disabled}
        data-testid="file-upload-hidden-input"
        style={{
          position: "absolute",
          clip: "rect(0,0,0,0)",
          visibility: "hidden",
          width: "1px",
        }}
      />
    </div>
  );
};

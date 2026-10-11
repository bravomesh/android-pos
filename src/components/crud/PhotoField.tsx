import { ChangeEvent, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PhotoCameraIcon from "@mui/icons-material/PhotoCameraRounded";
import ImageIcon from "@mui/icons-material/ImageRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import { toast } from "../../toast/useToast";

const MAX_SIDE = 360;

/** Shrink a camera picture to a small JPEG, so hundreds of them stay light to store and to sync. */
export async function shrinkPhoto(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export interface PhotoFieldProps {
  label: string;
  value: string;
  onChange: (photo: string) => void;
  helperText?: string;
}

/** A product picture: taken with the camera or picked from the gallery, and replaceable. */
export default function PhotoField({ label, value, onChange, helperText }: PhotoFieldProps) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Cleared so that picking the same picture again still fires a change.
    e.target.value = "";
    if (!file) return;
    try {
      onChange(await shrinkPhoto(file));
    } catch {
      toast.error("That picture could not be read. Try another one");
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
      <Box
        sx={(theme) => ({
          width: 112,
          height: 112,
          flexShrink: 0,
          borderRadius: "16px",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          color: "text.secondary",
          bgcolor: "action.hover",
          border: value ? "none" : `1.5px dashed ${theme.palette.divider}`,
        })}
      >
        {value ? (
          <Box component="img" src={value} alt={label} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <ImageIcon aria-hidden sx={{ fontSize: 36 }} />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start" }}>
        <Typography variant="subtitle2">{label}</Typography>
        {helperText && (
          <Typography variant="caption" color="text.secondary">
            {helperText}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="contained" startIcon={<PhotoCameraIcon />} onClick={() => camera.current?.click()} sx={{ minHeight: 44 }}>
            {value ? "Retake" : "Take photo"}
          </Button>
          <Button variant="outlined" onClick={() => gallery.current?.click()} sx={{ minHeight: 44 }}>
            Choose
          </Button>
          {value && (
            <Button color="error" startIcon={<DeleteIcon />} onClick={() => onChange("")} sx={{ minHeight: 44 }}>
              Remove
            </Button>
          )}
        </Box>
      </Box>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} data-testid="photo-camera" />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={handleFile} data-testid="photo-gallery" />
    </Box>
  );
}

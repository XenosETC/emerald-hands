param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies @([System.Drawing.Bitmap].Assembly.Location) -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class MagentaKey {
  public static void Remove(string inputPath, string outputPath) {
    using (var source = new Bitmap(inputPath))
    using (var bitmap = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb)) {
      using (var graphics = Graphics.FromImage(bitmap)) {
        graphics.DrawImageUnscaled(source, 0, 0);
      }

      var rect = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
      var data = bitmap.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      var bytes = Math.Abs(data.Stride) * data.Height;
      var pixels = new byte[bytes];
      Marshal.Copy(data.Scan0, pixels, 0, bytes);

      for (var i = 0; i < pixels.Length; i += 4) {
        var b = pixels[i];
        var g = pixels[i + 1];
        var r = pixels[i + 2];
        var magenta = Math.Min(r, b) - g;
        if (r > 145 && b > 115 && magenta > 48) {
          var alpha = Math.Max(0, Math.Min(255, 255 - (magenta - 48) * 3));
          pixels[i + 3] = (byte)alpha;
          pixels[i] = (byte)Math.Min(b, g * 1.2);
          pixels[i + 2] = (byte)Math.Min(r, g * 1.2);
        }
      }

      Marshal.Copy(pixels, 0, data.Scan0, bytes);
      bitmap.UnlockBits(data);
      bitmap.Save(outputPath, ImageFormat.Png);
    }
  }
}
'@

$inputResolved = (Resolve-Path -LiteralPath $InputPath).Path
$outputResolved = [System.IO.Path]::GetFullPath($OutputPath)
[MagentaKey]::Remove($inputResolved, $outputResolved)
Get-Item -LiteralPath $outputResolved

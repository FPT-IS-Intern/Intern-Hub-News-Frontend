import { Pipe, PipeTransform } from '@angular/core';
import { ImageUtils } from '../utils/image.utils';

@Pipe({
  name: 'fileUrl',
  standalone: true
})
export class FileUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return ImageUtils.getFileUrl(value);
  }
}

import * as fs from 'fs';
import { remote } from 'electron';
import { Component } from '@angular/core';
import { QueueService } from './queue.service';
import { FileService } from './file.service';
import { FileInfo, Preset } from './file-info';

@Component({ templateUrl: 'scripts/drop-area.component.html' })
export class DropAreaComponent {
  allowedExtensions = new Set(['.mp4', '.avi', '.mov', '.3gp']);
  filesAreOver = false;
  files: FileInfo[] = [];

  constructor(
    fileService: FileService,
    private queueService: QueueService) {

    this.files = fileService.files;
  }

  onFilesOver(filesOver: boolean): void {
    this.filesAreOver = filesOver;
  }

  onFilesDrop(fs: File[]): void {
    fs.forEach(newFile => {
      if (!this.files.some(fi => fi.file.path === newFile.path)) {
        this.files.push(new FileInfo(newFile));
      }
    });
  }

  durationChange(event: Event) {
    const video = event.target as HTMLVideoElement;
    if (!video.duration) {
      return;
    }
    const idx = +video.id.substr(5);
    this.files[idx].duration = video.duration;
  }

  createQueue(): void {
    const queueXml = this.queueService.create(this.files);
    const config: Electron.SaveDialogOptions = {
      title: 'Create Queue',
      defaultPath: 'queue.hbq'
    };
    remote.dialog.showSaveDialog(
      remote.getCurrentWindow(),
      config,
      path => path && fs.writeFileSync(path, queueXml));
  }

  removeFile(fileIndex: number): boolean {
    if (this.files.length <= fileIndex) {
      throw new Error('File index is out of bounds.');
    }
    this.files.splice(fileIndex, 1);
    return false;
  }

  formatTime(totalSeconds: number) {
    return new Intl
      .DateTimeFormat('en-US', { minute: 'numeric', second: 'numeric' })
      .format(new Date(totalSeconds * 1000));
  }

  formatSegment(file: FileInfo): string {
    const { firstSecond, lastSecond } = file.config.segment;
    const from = this.formatTime(firstSecond || 0);
    const till = this.formatTime(lastSecond || file.duration);
    return `${from}–${till}`;
  }

  hasDifferentTargetName(file: FileInfo): boolean {
    return file.config.getTargetName() !== file.name;
  }

  getPresetName(file: FileInfo): string {
    switch (file.config.preset) {
      case Preset.IPad:
        return 'iPad';
      case Preset.Canon9X:
        return 'Canon 9X';
      case Preset.Nikon:
        return 'Nikon';
      default:
        return 'Unknown!';
    }
  }
}

import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewEncapsulation,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';

import {
  ButtonContainerComponent,
  IconComponent,
  InputTextComponent,
} from '@goat-bravos/intern-hub-layout';

import { forkJoin, of, switchMap, catchError } from 'rxjs';
import { DmsService } from '../../services/dms.service';
import { ImageUtils } from '../../utils/image.utils';
import {
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsTopicResponse,
  NewsStatusResponse,
} from '../../models/news';
import { NewsService } from '../../services/news.service';
import { NewsTopicService } from '../../services/news-topic.service';
import { NewsStatusService } from '../../services/news-status.service';

@Component({
  selector: 'app-create-news',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonContainerComponent,
    IconComponent,
    InputTextComponent,
    QuillEditorComponent,
  ],
  templateUrl: './create-news.component.html',
  styleUrl: './create-news.component.scss',
})
export class CreateNewsComponent implements OnInit {
  form!: FormGroup;
  topics: NewsTopicResponse[] = [];
  statuses: NewsStatusResponse[] = [];
  loadingMeta = false;
  submitting = false;

  // Thumbnail drag & drop state
  thumbnailPreview: string | null = null;
  selectedFile: File | null = null;
  currentThumbnailKey: string | null = null;
  isDraggingOver = false;

  // Custom Dropdown State
  showTopicDropdown = false;
  newsId: string | null = null;
  isEditMode = false;

  // Form field values (for InputTextComponent two-way binding)
  titleValue = '';
  shortDescriptionValue = '';
  bodyValue = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly newsService: NewsService,
    private readonly topicService: NewsTopicService,
    private readonly statusService: NewsStatusService,
    private readonly dmsService: DmsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly el: ElementRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMetadata();
    this.checkEditMode();
  }

  private checkEditMode(): void {
    this.newsId = this.route.snapshot.paramMap.get('id');
    if (this.newsId && this.newsId !== 'create-news') {
      this.isEditMode = true;
      this.loadNewsData(this.newsId);
    }
  }

  private loadNewsData(id: string): void {
    forkJoin({
      newsRes: this.newsService.getById(id),
      meta: forkJoin({
        topics: this.topicService.getAll(),
        statuses: this.statusService.getAll(),
      }),
    }).subscribe({
      next: ({ newsRes, meta }) => {
        if (newsRes.data) {
          const news = newsRes.data;
          this.topics = meta.topics.data || [];
          this.statuses = meta.statuses.data || [];

          const foundStatus = this.statuses.find((s) => s.name === news.status);

          this.form.patchValue({
            title: news.title,
            shortDescription: news.shortDescription,
            body: news.body,
            topicIds: news.topics ? news.topics.map((t: any) => t.id) : [],
            statusId: foundStatus ? foundStatus.id : null,
            featured: news.featured,
          });

          this.titleValue = news.title;
          this.shortDescriptionValue = news.shortDescription;
          this.bodyValue = news.body;
          this.currentThumbnailKey = news.thumbNail || null;
          this.thumbnailPreview = ImageUtils.getFileUrl(news.thumbNail);
          this.cdr.markForCheck();
        }
      },
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(150)]],
      shortDescription: ['', [Validators.required, Validators.maxLength(255)]],
      body: ['', [Validators.required]],
      topicIds: [[]],
      statusId: [null, [Validators.required]],
      featured: [false],
    });
  }

  private loadMetadata(): void {
    this.loadingMeta = true;
    forkJoin({
      topics: this.topicService.getAll(),
      statuses: this.statusService.getAll(),
    }).subscribe({
      next: ({ topics, statuses }) => {
        this.topics = topics.data || [];
        this.statuses = statuses.data || [];
        this.loadingMeta = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingMeta = false;
        globalThis.alert('Không thể tải danh sách chủ đề / trạng thái.');
      },
    });
  }

  // ─── TITLE / BODY binding ──────────────────────────────────────────────────

  onTitleChange(val: string): void {
    this.titleValue = val;
    this.form.get('title')?.setValue(val);
    this.form.get('title')?.markAsDirty();
  }

  onShortDescriptionChange(val: string): void {
    this.shortDescriptionValue = val;
    this.form.get('shortDescription')?.setValue(val);
    this.form.get('shortDescription')?.markAsDirty();
  }

  get titleError(): string {
    const ctrl = this.form.get('title');
    if (ctrl?.dirty && ctrl.hasError('required')) return 'Tiêu đề không được để trống';
    if (ctrl?.dirty && ctrl.hasError('maxlength')) return 'Tiêu đề tối đa 150 ký tự';
    return '';
  }

  get shortDescriptionError(): string {
    const ctrl = this.form.get('shortDescription');
    if (ctrl?.dirty && ctrl.hasError('required')) return 'Mô tả ngắn không được để trống';
    if (ctrl?.dirty && ctrl.hasError('maxlength')) return 'Mô tả ngắn tối đa 255 ký tự';
    return '';
  }

  get bodyError(): string {
    const ctrl = this.form.get('body');
    if (ctrl?.dirty && ctrl.hasError('required')) return 'Nội dung không được để trống';
    return '';
  }

  // ─── CUSTOM DROPDOWNS ─────────────────────────────────────────────────────

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showTopicDropdown = false;
    }
  }

  getStatusName(): string {
    const statusId = this.form.get('statusId')?.value;
    if (!statusId) return this.isEditMode ? 'Chờ duyệt' : 'Nháp';
    const status = this.statuses.find(s => s.id === statusId);
    if (!status) return 'Nháp';
    const name = status.name?.toUpperCase();
    if (name === 'APPROVE' || name === 'QUYẾT ĐỊNH ĐĂNG') return 'Đã duyệt';
    if (name === 'PENDING' || name === 'CHỜ DUYỆT') return 'Chờ duyệt';
    if (name === 'DRAFT' || name === 'BẢN NHÁP') return 'Nháp';
    return status.name || 'Nháp';
  }

  get selectedTopicNames(): string {
    const ids: string[] = this.form.get('topicIds')?.value || [];
    if (ids.length === 0) return '';
    return this.topics
      .filter((t) => ids.includes(t.id))
      .map((t) => t.name)
      .join(', ');
  }

  isTopicSelected(topicId: string): boolean {
    const ids: string[] = this.form.get('topicIds')?.value || [];
    return ids.includes(topicId);
  }

  get selectedStatusName(): string {
    const id = this.form.get('statusId')?.value;
    if (!id) return '';
    const status = this.statuses.find((s) => s.id === id);
    return status ? status.name : '';
  }

  toggleTopicDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.showTopicDropdown = !this.showTopicDropdown;
  }

  selectTopic(topic: NewsTopicResponse): void {
    const ids: string[] = this.form.get('topicIds')?.value || [];
    const index = ids.indexOf(topic.id);
    if (index > -1) {
      ids.splice(index, 1);
    } else {
      ids.push(topic.id);
    }
    this.form.get('topicIds')?.setValue([...ids]);
    this.cdr.markForCheck();
  }

  // ─── THUMBNAIL UPLOAD ─────────────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.processImageFile(file);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processImageFile(file);
    }
    input.value = '';
  }

  private processImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      globalThis.alert('Vui lòng chọn file hình ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      globalThis.alert('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.thumbnailPreview = result;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeThumbnail(): void {
    this.thumbnailPreview = null;
    this.selectedFile = null;
  }

  triggerFileInput(): void {
    const input = document.getElementById('thumbnail-input') as HTMLInputElement;
    input?.click();
  }

  // ─── ACTIONS ────────────────────────────────────────────────────────────────

  submitWithStatus(statusName: string): void {
    const status = this.statuses.find((s) => {
      const name = s.name.toUpperCase();
      if (statusName.toUpperCase() === 'PENDING') {
        return name === 'PENDING' || name === 'CHỜ DUYỆT' || name === 'QUYẾT ĐỊNH ĐĂNG';
      }
      if (statusName.toUpperCase() === 'DRAFT') {
        return name === 'DRAFT' || name === 'BẢN NHÁP' || name === 'NHÁP';
      }
      return name === statusName.toUpperCase();
    });

    if (!status) {
      globalThis.alert(`Không tìm thấy cấu hình trạng thái: ${statusName}`);
      return;
    }

    this.form.get('statusId')?.setValue(status.id);
    this.submit();
  }

  // ─── SUBMIT ────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.submitting) return;

    // Mark all controls dirty to trigger validation display
    Object.values(this.form.controls).forEach((ctrl) => {
      ctrl.markAsDirty();
      ctrl.updateValueAndValidity({ onlySelf: true });
    });

    if (this.form.invalid) return;

    this.submitting = true;
    const values = this.form.value;

    const requestBody: CreateNewsRequest | UpdateNewsRequest = {
      title: values.title,
      shortDescription: values.shortDescription,
      body: values.body,
      topicIds: values.topicIds && values.topicIds.length > 0 ? values.topicIds : (this.isEditMode ? [] : undefined),
      statusId: values.statusId,
      featured: values.featured,
      thumbnail: this.currentThumbnailKey ?? undefined,
    } as any;

    let uploadObs = of<string | null>(null);

    // Chỉ thực hiện xử lý ảnh nếu có sự thay đổi (chọn file mới hoặc xóa file cũ)
    const hasNewFile = !!this.selectedFile;
    const isFileRemoved = !this.thumbnailPreview && !!this.currentThumbnailKey;

    if (hasNewFile) {
      // TRƯỜNG HỢP 1: Chọn file mới -> Upload lên DMS
      let deleteObs = of<any>(null);
      // Nếu đang sửa và có ảnh cũ, xóa ảnh cũ trước khi upload mới
      if (this.isEditMode && this.currentThumbnailKey) {
        deleteObs = this.dmsService.delete(this.currentThumbnailKey).pipe(
          catchError(() => of(null))
        );
      }

      uploadObs = deleteObs.pipe(
        switchMap(() => this.dmsService.upload(this.selectedFile!)),
        switchMap((res) => of(res.data.objectKey))
      );
    } 
    else if (isFileRemoved && this.isEditMode) {
      // TRƯỜNG HỢP 2: Người dùng xóa ảnh cũ -> Chỉ gọi Delete DMS
      uploadObs = this.dmsService.delete(this.currentThumbnailKey!).pipe(
        switchMap(() => of('')), // Trả về chuỗi rỗng để backend xóa field thumbnail
        catchError(() => of(''))
      );
    }
    // Nếu không thuộc 2 trường hợp trên (không thay đổi), uploadObs = of(null) -> Giữ nguyên thumbnail cũ

    uploadObs.pipe(
      switchMap((objectKey) => {
        if (objectKey !== null) {
          requestBody.thumbnail = objectKey;
        }

        if (this.isEditMode) {
          return this.newsService.update(this.newsId!, requestBody as UpdateNewsRequest);
        } else {
          return this.newsService.create(requestBody as CreateNewsRequest);
        }
      })
    ).subscribe({
      next: () => {
        this.submitting = false;
        globalThis.alert(
          this.isEditMode ? 'Cập nhật tin tức thành công!' : 'Tạo bài tin tức thành công!'
        );
        this.router.navigate(['/news/management/dashboard']);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Submit error:', err);
        const errorMsg = err?.error?.status?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
        globalThis.alert(errorMsg);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/news/management/dashboard']);
  }
}

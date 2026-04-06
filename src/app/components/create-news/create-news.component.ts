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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';

import {
  ButtonContainerComponent,
  IconComponent,
  InputTextComponent,
} from '@goat-bravos/intern-hub-layout';

import { forkJoin, of, switchMap, catchError } from 'rxjs';
import { DmsService } from '../../services/dms.service';
import { ImageUtils } from '../../utils/image.utils';
import { getS3DomainUrl } from '../../core/config/app-config';
import {
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsTopicResponse,
  NewsStatusResponse,
} from '../../models/news';
import { NewsService } from '../../services/news.service';
import { NewsTopicService } from '../../services/news-topic.service';
import { NewsStatusService } from '../../services/news-status.service';
import { TicketApproverService } from '../../services/ticket-approver.service';

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
  showApprovalNoticePopup = false;
  approvalPopupTitle = 'Đang chờ phê duyệt';
  approvalPopupSubtitle = 'Bài đăng sẽ được đăng khi được phê duyệt.';
  approvalPopupConfirmText = 'Phiếu của tôi';
  submitErrorMessage = '';
  private approvalPopupNavigateUrl = '/ticket/my-ticket';
  private canApproveLevel2 = false;
  private intendedSubmitStatus: 'PENDING' | 'DRAFT' | 'APPROVED' | null = null;

  private readonly s3DomainUrl = getS3DomainUrl();

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly newsService: NewsService,
    private readonly topicService: NewsTopicService,
    private readonly statusService: NewsStatusService,
    private readonly ticketApproverService: TicketApproverService,
    private readonly dmsService: DmsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMetadata();
    this.loadApproverPermission();
    this.checkEditMode();
  }

  private loadApproverPermission(): void {
    this.ticketApproverService.getMyApproverPermission().subscribe({
      next: (res) => {
        this.canApproveLevel2 = !!res?.data?.canApproveLevel2;
      },
      error: () => {
        this.canApproveLevel2 = false;
      },
    });
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

  // TITLE / BODY binding

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

  // CUSTOM DROPDOWNS

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showTopicDropdown = false;
    }
  }

  getStatusName(): string {
    const statusId = this.form.get('statusId')?.value;
    if (!statusId) return this.isEditMode ? 'Chờ duyệt' : 'Nháp';
    const status = this.statuses.find((s) => s.id === statusId);
    if (!status) return 'Nháp';
    const name = this.normalizeStatusName(status.name);
    if (name === 'APPROVE' || name === 'QUYET DINH DANG') return 'Đã duyệt';
    if (name === 'PENDING' || name === 'CHO DUYET') return 'Chờ duyệt';
    if (name === 'DRAFT' || name === 'BAN NHAP' || name === 'NHAP') return 'Nháp';
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

  // THUMBNAIL UPLOAD

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

  // ACTIONS

  submitWithStatus(statusName: string): void {
    if (this.loadingMeta) {
      return;
    }
    this.submitErrorMessage = '';

    const normalizedAction = statusName.toUpperCase();

    const targetMode =
      normalizedAction === 'PENDING'
        ? (this.canApproveLevel2 ? 'APPROVED' : 'PENDING')
        : 'DRAFT';
    this.intendedSubmitStatus = targetMode;

    let status = this.findStatusByMode(targetMode);

    // Fallback: if publish-approved mapping is missing, fallback to pending to avoid blocking submit.
    if (!status && targetMode === 'APPROVED') {
      status = this.findStatusByMode('PENDING');
      this.intendedSubmitStatus = 'PENDING';
    }

    if (!status) {
      console.error('[CreateNews] Missing status mapping for submit mode', {
        statusName,
        targetMode,
        statuses: this.statuses?.map((s) => s?.name),
      });
      return;
    }

    this.form.get('statusId')?.setValue(status.id);
    this.submit();
  }

  // SUBMIT

  submit(): void {
    if (this.submitting) return;
    this.submitErrorMessage = '';

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
      topicIds:
        values.topicIds && values.topicIds.length > 0
          ? values.topicIds
          : this.isEditMode
            ? []
            : undefined,
      statusId: values.statusId,
      featured: values.featured,
      thumbnail: this.currentThumbnailKey
        ? this.toThumbnailUrl(this.currentThumbnailKey)
        : undefined,
    } as any;

    let uploadObs = of<string | null>(null);

    // Chỉ thực hiện xử lý ảnh nếu có sự thay đổi (chọn file mới hoặc xóa file cũ)
    const hasNewFile = !!this.selectedFile;
    const isFileRemoved = !this.thumbnailPreview && !!this.currentThumbnailKey;

    if (hasNewFile) {
      let deleteObs = of<any>(null);
      if (this.currentThumbnailKey) {
        const oldObjectKey = this.extractObjectKey(this.currentThumbnailKey);
        if (oldObjectKey) {
          deleteObs = this.dmsService.delete(oldObjectKey).pipe(catchError(() => of(null)));
        }
      }

      uploadObs = deleteObs.pipe(
        switchMap(() => this.dmsService.upload(this.selectedFile!)),
        switchMap((res) => {
          const objectKey = this.extractUploadObjectKey(res.data);
          const thumbnailUrl = objectKey ? this.buildThumbnailUrl(objectKey) : '';
          return of(thumbnailUrl);
        }),
      );
    } else if (isFileRemoved && this.isEditMode) {
      const oldObjectKey = this.extractObjectKey(this.currentThumbnailKey);
      if (oldObjectKey) {
        uploadObs = this.dmsService.delete(oldObjectKey).pipe(
          switchMap(() => of('')), // Trả về chuỗi rỗng để backend xóa field thumbnail
          catchError(() => of('')),
        );
      } else {
        uploadObs = of('');
      }
    }
    uploadObs
      .pipe(
        switchMap((thumbnailValue) => {
          if (thumbnailValue !== null) {
            requestBody.thumbnail =
              thumbnailValue === '' ? '' : this.toThumbnailUrl(thumbnailValue);
          }

          if (this.isEditMode) {
            return this.newsService.update(this.newsId!, requestBody as UpdateNewsRequest);
          } else {
            return this.newsService.create(requestBody as CreateNewsRequest);
          }
        }),
      )
      .subscribe({
        next: () => {
          this.submitting = false;
          const needApprovalNotice =
            !this.isEditMode && this.intendedSubmitStatus === 'PENDING' && !this.canApproveLevel2;

          if (!this.isEditMode) {
            if (needApprovalNotice) {
              this.openApprovalNoticePopup(
                'Đang chờ phê duyệt',
                'Bài đăng sẽ được đăng khi được phê duyệt.',
                'Phiếu của tôi',
                '/ticket/my-ticket',
              );
            } else {
              this.openApprovalNoticePopup(
                'Đăng bài thành công',
                'Bài viết đã được đăng thành công.',
                'Về quản lý tin',
                '/news/management/dashboard',
              );
            }
            return;
          }

          globalThis.alert('Cập nhật tin tức thành công!');
          this.router.navigate(['/news/management/dashboard']);
        },
        error: (err) => {
          this.submitting = false;
          console.error('Submit error:', err);
          this.submitErrorMessage = this.mapSubmitErrorMessage(err);
        },
      });
  }

  private mapSubmitErrorMessage(err: any): string {
    const rawMessage = (err?.error?.status?.message || '').toString();
    const normalizedMessage = rawMessage.toUpperCase();

    if (normalizedMessage.includes('STATUS NOT FOUND: PENDING')) {
      return 'Hệ thống chưa cấu hình trạng thái Chờ duyệt. Vui lòng liên hệ quản trị viên.';
    }

    if (normalizedMessage.includes('STATUS NOT FOUND: APPROVED')) {
      return 'Hệ thống chưa cấu hình trạng thái Đã duyệt. Vui lòng liên hệ quản trị viên.';
    }

    return rawMessage || 'Có lỗi xảy ra. Vui lòng thử lại.';
  }

  closeApprovalNoticePopup(): void {
    this.showApprovalNoticePopup = false;
  }

  confirmApprovalNoticePopup(): void {
    this.showApprovalNoticePopup = false;
    this.router.navigate([this.approvalPopupNavigateUrl]);
  }

  private openApprovalNoticePopup(
    title: string,
    subtitle: string,
    confirmText: string,
    navigateUrl: string,
  ): void {
    this.approvalPopupTitle = title;
    this.approvalPopupSubtitle = subtitle;
    this.approvalPopupConfirmText = confirmText;
    this.approvalPopupNavigateUrl = navigateUrl;
    this.showApprovalNoticePopup = true;
  }
  private buildThumbnailUrl(objectKey: string): string {
    if (!objectKey) {
      return '';
    }

    const cleanKey = objectKey.replace(/^\/+/, '');
    if (!this.s3DomainUrl) {
      return cleanKey;
    }

    const cleanDomain = this.s3DomainUrl.replace(/\/+$/, '');
    return `${cleanDomain}/${cleanKey}`;
  }

  private toThumbnailUrl(value: string): string {
    if (!value) {
      return '';
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    return this.buildThumbnailUrl(value);
  }

  private extractObjectKey(thumbnailValue: string | null | undefined): string | null {
    if (!thumbnailValue) {
      return null;
    }

    if (!thumbnailValue.startsWith('http://') && !thumbnailValue.startsWith('https://')) {
      return this.normalizeObjectKey(thumbnailValue) || null;
    }

    try {
      const parsed = new URL(thumbnailValue);

      const queryKey = parsed.searchParams.get('key');
      if (queryKey) {
        return this.normalizeObjectKey(queryKey) || null;
      }

      // If thumbnail is full URL from DB, remove exactly the shell env prefix length
      if (this.s3DomainUrl) {
        const cleanDomain = this.s3DomainUrl.replace(/\/+$/, '');
        if (thumbnailValue === cleanDomain) {
          return null;
        }
        if (thumbnailValue.startsWith(cleanDomain)) {
          return this.normalizeObjectKey(thumbnailValue.substring(cleanDomain.length)) || null;
        }
      }

      return this.normalizeObjectKey(parsed.pathname) || null;
    } catch {
      return null;
    }
  }

  private extractUploadObjectKey(data: any): string {
    if (!data) {
      return '';
    }

    if (typeof data.objectKey === 'string') {
      return this.normalizeObjectKey(data.objectKey);
    }

    if (Array.isArray(data.objectKeys) && typeof data.objectKeys[0] === 'string') {
      return this.normalizeObjectKey(data.objectKeys[0]);
    }

    return '';
  }

  private normalizeObjectKey(rawKey: string): string {
    if (!rawKey) {
      return '';
    }

    const trimmed = rawKey.trim();
    if (!trimmed) {
      return '';
    }

    try {
      // Handle cases where backend returns URL-encoded object key (e.g. news%2Fthumbnails%2F...)
      return decodeURIComponent(trimmed).replace(/^\/+/, '');
    } catch {
      return trimmed.replace(/^\/+/, '');
    }
  }

  goBack(): void {
    this.router.navigate(['/news/management/dashboard']);
  }

  private findStatusByMode(mode: 'PENDING' | 'DRAFT' | 'APPROVED'): NewsStatusResponse | undefined {
    const aliases: Record<'PENDING' | 'DRAFT' | 'APPROVED', string[]> = {
      PENDING: ['PENDING', 'CHO DUYET'],
      DRAFT: ['DRAFT', 'BAN NHAP', 'NHAP', 'LUU NHAP'],
      APPROVED: ['APPROVE', 'APPROVED', 'QUYET DINH DANG', 'DA DUYET'],
    };

    return this.statuses.find((s) => {
      const normalized = this.normalizeStatusName(s.name);
      return aliases[mode].includes(normalized);
    });
  }

  private normalizeStatusName(name: string | null | undefined): string {
    const raw = (name || '').trim().toUpperCase();
    return raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, ' ');
  }
}


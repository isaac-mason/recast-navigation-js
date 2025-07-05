import {
  RouterProvider,
  createBrowserRouter,
  redirect,
} from 'react-router';
import { EditorPage, UploadPage } from './pages';

export const RouterPaths = {
  upload: '/',
  editor: '/editor',
};

const router = createBrowserRouter([
  {
    path: RouterPaths.upload,
    Component: UploadPage,
  },
  {
    path: RouterPaths.editor,
    Component: EditorPage,
  },
  {
    path: '*',
    loader: () => {
      return redirect(RouterPaths.upload);
    },
  },
]);

export default () => <RouterProvider router={router} />;
